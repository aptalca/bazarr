# -*- coding: utf-8 -*-
from __future__ import absolute_import
import logging
import re
import io
import os
from random import randint
from bs4 import BeautifulSoup
from zipfile import ZipFile, is_zipfile
from rarfile import RarFile, is_rarfile
from requests import Session
from guessit import guessit
from subliminal_patch.providers import Provider
from subliminal_patch.subtitle import Subtitle
from subliminal_patch.utils import sanitize, fix_inconsistent_naming
from subliminal.exceptions import ProviderError
from subliminal.utils import sanitize_release_group
from subliminal.subtitle import guess_matches
from subliminal.video import Episode, Movie
from subliminal.subtitle import fix_line_ending
from subzero.language import Language
from .utils import FIRST_THOUSAND_OR_SO_USER_AGENTS as AGENT_LIST

logger = logging.getLogger(__name__)

def fix_tv_naming(title):
    """Fix TV show titles with inconsistent naming using dictionary, but do not sanitize them.

    :param str title: original title.
    :return: new title.
    :rtype: str

    """
    return fix_inconsistent_naming(title, {"Marvel's Daredevil": "Daredevil",
                                           "Marvel's Luke Cage": "Luke Cage",
                                           "Marvel's Iron Fist": "Iron Fist",
                                           "DC's Legends of Tomorrow": "Legends of Tomorrow",
                                           "Doctor Who (2005)": "Doctor Who",
                                           }, True)

class SubsUnacsSubtitle(Subtitle):
    """SubsUnacs Subtitle."""
    provider_name = 'subsunacs'

    def __init__(self, langauge, filename, type, video, link, fps, num_cds):
        super(SubsUnacsSubtitle, self).__init__(langauge)
        self.langauge = langauge
        self.filename = filename
        self.page_link = link
        self.type = type
        self.video = video
        self.fps = fps
        self.num_cds = num_cds
        self.release_info = os.path.splitext(filename)[0]

    @property
    def id(self):
        return self.page_link + self.filename

    def get_fps(self):
        return self.fps

    def make_picklable(self):
        self.content = None
        return self

    def get_matches(self, video):
        matches = set()

        video_filename = video.name
        video_filename = os.path.basename(video_filename)
        video_filename, _ = os.path.splitext(video_filename)
        video_filename = sanitize_release_group(video_filename)

        subtitle_filename = self.filename
        subtitle_filename = os.path.basename(subtitle_filename)
        subtitle_filename, _ = os.path.splitext(subtitle_filename)
        subtitle_filename = sanitize_release_group(subtitle_filename)

        if video_filename == subtitle_filename:
             matches.add('hash')

        if video.year and self.year == video.year:
            matches.add('year')

        matches |= guess_matches(video, guessit(self.title, {'type': self.type}))
        matches |= guess_matches(video, guessit(self.filename, {'type': self.type}))
        return matches


class SubsUnacsProvider(Provider):
    """SubsUnacs Provider."""
    languages = {Language('por', 'BR')} | {Language(l) for l in [
        'bul', 'eng'
    ]}

    def initialize(self):
        self.session = Session()
        self.session.headers['User-Agent'] = AGENT_LIST[randint(0, len(AGENT_LIST) - 1)]
        self.session.headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        self.session.headers["Accept-Language"] = "en-US,en;q=0.5"
        self.session.headers["Accept-Encoding"] = "gzip, deflate, br"
        self.session.headers["DNT"] = "1"
        self.session.headers["Connection"] = "keep-alive"
        self.session.headers["Upgrade-Insecure-Requests"] = "1"
        self.session.headers["Cache-Control"] = "max-age=0"

    def terminate(self):
        self.session.close()

    def query(self, language, video):
        subtitles = []
        isEpisode = isinstance(video, Episode)

        params = {
            'm': '',
            'l': 0,
            'c': '',
            'y': '',
            'action': "   Търси   ",
            'a': '',
            'd': '',
            'u': '',
            'g': '',
            't': '',
            'imdbcheck': 1}

        if isEpisode:
            params['m'] = "%s %02d %02d" % (sanitize(fix_tv_naming(video.series), {'\''}), video.season, video.episode)
        else:
            params['y'] = video.year
            params['m'] = sanitize(video.title, {'\''})

        if language == 'en' or language == 'eng':
            params['l'] = 1

        logger.info('Searching subtitle %r', params)
        response = self.session.post('https://subsunacs.net/search.php', params=params, allow_redirects=False, timeout=10, headers={
            'Referer': 'https://subsunacs.net/index.php',
            })

        response.raise_for_status()

        if response.status_code != 200:
            logger.debug('No subtitles found')
            return subtitles

        soup = BeautifulSoup(response.content, 'lxml')
        rows = soup.findAll('tr', onmouseover=True)

        # Search on first 20 rows only
        for row in rows[:20]:
            a_element_wrapper = row.find('td', {'class': 'tdMovie'})
            if a_element_wrapper:
                element = a_element_wrapper.find('a', {'class': 'tooltip'})
                if element:
                    link = element.get('href')
                    notes = element.get('title')
                    title = element.get_text()

                    try:
                        year = int(element.find_next_sibling('span', {'class' : 'smGray'}).text.strip('\xa0()'))
                    except:
                        year = None

                    td = row.findAll('td')

                    try:
                        num_cds = int(td[1].get_text())
                    except:
                        num_cds = None

                    try:
                        fps = float(td[2].get_text())
                    except:
                        fps = None

                    try:
                        rating = float(td[3].find('img').get('title'))
                    except:
                        rating = None

                    try:
                        uploader = td[5].get_text()
                    except:
                        uploader = None

                    logger.info('Found subtitle link %r', link)
                    sub = self.download_archive_and_add_subtitle_files('https://subsunacs.net' + link, language, video, fps, num_cds)
                    for s in sub:
                        s.title = title
                        s.notes = notes
                        s.year = year
                        s.rating = rating
                        s.uploader = uploader
                    subtitles = subtitles + sub
        return subtitles

    def list_subtitles(self, video, languages):
        return [s for l in languages for s in self.query(l, video)]

    def download_subtitle(self, subtitle):
        if subtitle.content:
            pass
        else:
            seeking_subtitle_file = subtitle.filename
            arch = self.download_archive_and_add_subtitle_files(subtitle.page_link, subtitle.language, subtitle.video,
                                                                subtitle.fps, subtitle.num_cds)
            for s in arch:
                if s.filename == seeking_subtitle_file:
                    subtitle.content = s.content

    def process_archive_subtitle_files(self, archiveStream, language, video, link, fps, num_cds):
        subtitles = []
        type = 'episode' if isinstance(video, Episode) else 'movie'
        for file_name in archiveStream.namelist():
            if file_name.lower().endswith(('.srt', '.sub', '.txt')):
                file_is_txt = True if file_name.lower().endswith('.txt') else False
                if file_is_txt and re.search(r'subsunacs\.net|танете част|прочети|^read ?me|procheti', file_name, re.I): 
                    logger.info('Ignore readme txt file %r', file_name)
                    continue
                logger.info('Found subtitle file %r', file_name)
                subtitle = SubsUnacsSubtitle(language, file_name, type, video, link, fps, num_cds)
                subtitle.content = archiveStream.read(file_name)
                if file_is_txt == False or subtitle.is_valid():
                    subtitles.append(subtitle)
        return subtitles

    def download_archive_and_add_subtitle_files(self, link, language, video, fps, num_cds):
        logger.info('Downloading subtitle %r', link)
        request = self.session.get(link, headers={
            'Referer': 'https://subsunacs.net/search.php'
            })
        request.raise_for_status()

        archive_stream = io.BytesIO(request.content)
        if is_rarfile(archive_stream):
            return self.process_archive_subtitle_files(RarFile(archive_stream), language, video, link, fps, num_cds)
        elif is_zipfile(archive_stream):
            return self.process_archive_subtitle_files(ZipFile(archive_stream), language, video, link, fps, num_cds)
        else:
            logger.error('Ignore unsupported archive %r', request.headers)
            return []
