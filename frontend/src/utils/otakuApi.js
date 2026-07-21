import axios from 'axios';

const OTAKU_LIST_URL = import.meta.env.VITE_OTAKU_LIST_URL;

async function queryOtaku(query, variables) {
  try {
    const response = await axios.post(
      OTAKU_LIST_URL,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Otaku GraphQL Error:', error.response?.data || error.message);
    throw new Error("AniTv+ is currently under maintainance, please try again later");
  }
}

// Map Otaku media object to a TMDB-like formatted object for frontend
function mapToFrontendFormat(media) {
  return {
    tmdbId: media.id.toString(), // we use Otaku ID but keep tmdbId key for compatibility
    title: media.title.english || media.title.romaji || media.title.native,
    url: media.coverImage.extraLarge || media.coverImage.large,
    backdrop: media.bannerImage || media.coverImage.extraLarge,
    hasBannerImage: !!media.bannerImage,
    rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : 'N/A',
    year: media.startDate && media.startDate.year ? media.startDate.year : null,
    overview: media.description ? media.description.replace(/<[^>]*>?/gm, '') : '',
    mediaId: media.id.toString(),
    media_type: 'anime',
    format: media.format
  };
}

export const fetchTrendingAnime = async (page = 1, formats = null) => {
  const formatFilter = formats ? `, format_in: [${formats}]` : '';
  const query = `
    query ($page: Int) {
      Page (page: $page, perPage: 20) {
        media (type: ANIME, sort: TRENDING_DESC${formatFilter}) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day } format
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { page });
    return data.Page.media.map(mapToFrontendFormat);
  } catch (e) {
    throw e;
  }
};

export const fetchPopularAnime = async (page = 1, formats = null) => {
  const formatFilter = formats ? `, format_in: [${formats}]` : '';
  const query = `
    query ($page: Int) {
      Page (page: $page, perPage: 20) {
        media (type: ANIME, sort: POPULARITY_DESC${formatFilter}) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day } format
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { page });
    return data.Page.media.map(mapToFrontendFormat);
  } catch (e) {
    throw e;
  }
};

export const fetchTopRatedAnime = async (page = 1, formats = null) => {
  const formatFilter = formats ? `, format_in: [${formats}]` : '';
  const query = `
    query ($page: Int) {
      Page (page: $page, perPage: 20) {
        media (type: ANIME, sort: SCORE_DESC, popularity_greater: 10000${formatFilter}) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day } format
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { page });
    return data.Page.media.map(mapToFrontendFormat);
  } catch (e) {
    throw e;
  }
};

export const fetchNowPlayingAnime = async (page = 1, formats = null) => {
  const formatFilter = formats ? `, format_in: [${formats}]` : '';
  const query = `
    query ($page: Int) {
      Page (page: $page, perPage: 20) {
        media (type: ANIME, status: RELEASING, sort: POPULARITY_DESC${formatFilter}) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day } format
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { page });
    return data.Page.media.map(mapToFrontendFormat);
  } catch (e) {
    throw e;
  }
};

export const fetchUpcomingAnime = async (page = 1, formats = null) => {
  const formatFilter = formats ? `, format_in: [${formats}]` : '';
  const query = `
    query ($page: Int) {
      Page (page: $page, perPage: 20) {
        media (type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC${formatFilter}) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day } format
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { page });
    return data.Page.media.map(mapToFrontendFormat);
  } catch (e) {
    throw e;
  }
};

export const searchAnime = async (searchQuery, page = 1) => {
  const query = `
    query ($search: String, $page: Int) {
      Page (page: $page, perPage: 20) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (search: $search, type: ANIME) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day } format
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { search: searchQuery, page });
    return {
      results: data.Page.media.map(mapToFrontendFormat),
      page: data.Page.pageInfo.currentPage,
      totalPages: data.Page.pageInfo.lastPage
    };
  } catch (e) {
    throw e;
  }
};

// Helper to extract season number from title
function extractSeasonNumber(title) {
  if (!title) return 1;
  const match = title.match(/Season (\d+)|(\d+)(?:st|nd|rd|th) Season/i);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  return 1;
}

export const fetchAnimeDetails = async (id) => {
  const query = `
    query ($id: Int) {
      Media (id: $id) {
        id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description 
        startDate { year month day } status genres episodes duration format
        nextAiringEpisode { episode }
        trailer { id site }
        characters(sort: ROLE, perPage: 15) {
          edges {
            role
            node {
              name { full }
              image { large }
            }
          }
        }
        staff(sort: RELEVANCE, perPage: 5) {
          edges {
            role
            node {
              name { full }
              image { large }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id title { romaji english native } coverImage { extraLarge large } averageScore startDate { year } format type
            }
          }
        }
        recommendations(perPage: 12, sort: RATING_DESC) {
          nodes {
            rating
            mediaRecommendation {
              id title { english romaji native } coverImage { extraLarge large } bannerImage averageScore startDate { year } genres format type
            }
          }
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { id: parseInt(id) });
    const media = data.Media;
    
    // Process relations (filter for sequels, prequels, spin-offs, alternatives)
    const related = media.relations?.edges
      ?.filter(edge => edge.node && edge.relationType !== 'CHARACTER' && edge.relationType !== 'ADAPTATION' && edge.node.type === 'ANIME')
      ?.map(edge => ({
        ...mapToFrontendFormat(edge.node),
        relationType: edge.relationType.replace(/_/g, ' ')
      })) || [];

    const cast = media.characters?.edges?.map(edge => {
      const img = edge.node.image?.large;
      const isDefault = img && (img.includes('default.jpg') || img.includes('default.png'));
      return {
        name: edge.node.name.full,
        profile_path: isDefault ? null : img
      };
    }) || [];

    const directorEdge = media.staff?.edges?.find(edge => edge.role && edge.role.toLowerCase().includes('director'));
    let director = null;
    if (directorEdge) {
      const img = directorEdge.node.image?.large;
      const isDefault = img && (img.includes('default.jpg') || img.includes('default.png'));
      director = { 
        name: directorEdge.node.name.full, 
        profile_path: isDefault ? null : img 
      };
    }

    const recommendations = media.recommendations?.nodes
      ?.filter(n => n.mediaRecommendation && n.mediaRecommendation.type === 'ANIME')
      ?.map(n => mapToFrontendFormat(n.mediaRecommendation)) || [];

    const titleStr = media.title.english || media.title.romaji || media.title.native;
    const extractedSeason = extractSeasonNumber(titleStr);
    const epCount = media.episodes || (media.nextAiringEpisode ? media.nextAiringEpisode.episode - 1 : null);

    return {
      tmdbId: media.id.toString(),
      title: titleStr,
      url: media.coverImage.extraLarge || media.coverImage.large,
      backdrop: media.bannerImage || media.coverImage.extraLarge,
      rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : 'N/A',
      year: media.startDate && media.startDate.year ? media.startDate.year : null,
      overview: media.description ? media.description.replace(/<[^>]*>?/gm, '') : '',
      runtime: media.duration,
      currentSeason: extractedSeason,
      seasons: extractedSeason,
      episodes: epCount,
      seasonsData: [{ 
        season_number: extractedSeason, 
        episode_count: epCount || 1, 
        name: `Season ${extractedSeason}` 
      }],
      genres: media.genres ? media.genres.map(g => ({ name: g })) : [],
      cast: cast,
      related: related,
      recommendations: recommendations,
      director: director,
      creator: director,
      trailer: media.trailer && media.trailer.site === 'youtube' ? media.trailer.id : null,
      media_type: 'anime',
      status: media.status,
      format: media.format
    };
  } catch (e) {
    throw e;
  }
};

export const fetchAnimeByProvider = async (providerName, mediaType = 'tv', page = 1) => {
  const formats = mediaType === 'movie' ? '[MOVIE]' : '[TV, TV_SHORT, ONA, OVA]';
  const query = `
    query ($provider: String, $page: Int) {
      Page (page: $page, perPage: 20) {
        media (licensedBy: $provider, type: ANIME, format_in: ${formats}, sort: POPULARITY_DESC) {
          id title { romaji english native } coverImage { extraLarge large } bannerImage averageScore description startDate { year month day }
        }
      }
    }
  `;
  try {
    const data = await queryOtaku(query, { provider: providerName, page });
    return data.Page.media.map(m => ({ ...mapToFrontendFormat(m), media_type: mediaType }));
  } catch (e) {
    throw e;
  }
};

