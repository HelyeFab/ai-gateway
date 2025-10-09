const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface TempApiKey {
  key: string;
  expiresAt: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private tempKey: string | null = null;

  async generateTempKey(): Promise<TempApiKey> {
    try {
      const response = await fetch(`${API_URL}/api/temp-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate temporary key');
      }

      const data = await response.json();
      this.tempKey = data.key;
      return data;
    } catch (error) {
      console.error('Error generating temp key:', error);
      // For now, return a mock key for demo purposes
      const mockKey = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.tempKey = mockKey;
      return {
        key: mockKey,
        expiresAt: Date.now() + 3600000, // 1 hour
      };
    }
  }

  async testChat(prompt: string): Promise<ApiResponse> {
    try {
      const apiKey = this.tempKey || '';
      console.log('Making chat request with key:', apiKey?.substring(0, 20) + '...');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
      
      const response = await fetch(`${API_URL}/chat/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          model: 'deepseek-r1:8b',  
          prompt,
          stream: false,  // Disable streaming for now to debug
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error:', response.status, errorText);
        return { 
          success: false, 
          error: `API returned ${response.status}: ${errorText}` 
        };
      }

      // Handle non-streaming response
      const data = await response.json();
      
      if (data.response) {
        // Remove thinking tags and clean up the response
        const cleanResponse = data.response
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return { success: true, data: { response: cleanResponse } };
      } else {
        return { success: false, error: 'No response from model' };
      }
    } catch (error) {
      console.error('Chat API exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async testTTS(text: string, voice: string = 'en-US-JennyNeural'): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_URL}/tts/api/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.tempKey || '',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('TTS error:', error);
      return null;
    }
  }

  async testImageGen(prompt: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/image/api/generate/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.tempKey || '',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const apiClient = new ApiClient();