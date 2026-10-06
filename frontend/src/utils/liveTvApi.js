const LIVETV_API_URL = import.meta.env.VITE_LIVETV_API_URL;

export const liveTvApi = {
  getChannels: async () => {
    try {
      const response = await fetch(`${LIVETV_API_URL}/api/public/channels`);
      if (!response.ok) throw new Error('Failed to fetch Live TV channels');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Live TV channels:', error);
      throw error;
    }
  },
  
  getChannelDetails: async (id) => {
    try {
      const response = await fetch(`${LIVETV_API_URL}/api/public/channels/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch details for channel ${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching channel details for ${id}:`, error);
      throw error;
    }
  }
};
