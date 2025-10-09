"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParallaxSection } from "@/components/parallax-section";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { 
  Play, 
  Loader2, 
  Volume2, 
  Download,
  RefreshCw,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

const demoTabs = [
  { id: "chat", label: "Chat AI", icon: "💬", available: true },
  { id: "tts", label: "Text to Speech", icon: "🔊", available: true },
  { id: "image", label: "Image Gen", icon: "🎨", available: true },
  { id: "stt", label: "Speech to Text", icon: "🎤", available: true },
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState("chat");
  const [loading, setLoading] = useState(false);
  const [tempKey, setTempKey] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  
  // Demo states
  const [chatPrompt, setChatPrompt] = useState("Why is the sky blue?");
  const [chatResponse, setChatResponse] = useState("");
  const [ttsText, setTtsText] = useState("Welcome to SelfMind AI Gateway!");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("A futuristic city at sunset");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Generate temp key on mount
  useEffect(() => {
    const generateKey = async () => {
      try {
        const key = await apiClient.generateTempKey();
        setTempKey(key.key);
        const store = useAuthStore.getState();
        store.setTempApiKey(key.key);
      } catch (error) {
        console.error("Failed to generate temp key:", error);
      }
    };
    generateKey();
  }, []);

  const handleChatDemo = async () => {
    if (!tempKey) {
      toast.error("Please wait, generating demo key...");
      return;
    }

    setLoading(true);
    setChatResponse("");

    try {
      console.log("Using temp key:", tempKey);
      
      // Add a timeout toast after 5 seconds
      const timeoutToast = setTimeout(() => {
        toast.loading("The AI is thinking... This may take up to 30 seconds for the first response.", {
          id: 'thinking-toast'
        });
      }, 5000);
      
      const result = await apiClient.testChat(chatPrompt);
      clearTimeout(timeoutToast);
      toast.dismiss('thinking-toast');
      
      console.log("API Response:", result);
      
      if (result.success && result.data) {
        // Handle the response from Ollama
        const response = result.data.response || result.data.message || JSON.stringify(result.data);
        setChatResponse(response);
        toast.success("Chat API test successful!");
      } else {
        console.error("API Error:", result.error);
        toast.error(result.error || "Failed to get response from chat API");
        setChatResponse("");
      }
    } catch (error) {
      console.error("Chat demo error:", error);
      toast.error("Chat demo failed: " + (error as Error).message);
      setChatResponse("");
    } finally {
      setLoading(false);
    }
  };

  const handleTTSDemo = async () => {
    if (!tempKey) {
      toast.error("Please wait, generating demo key...");
      return;
    }

    setLoading(true);
    setAudioUrl(null);

    try {
      const blob = await apiClient.testTTS(ttsText);
      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        toast.success("TTS generated successfully!");
        
        // Clean up previous audio URL
        return () => {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
      } else {
        toast.error("Failed to generate audio from TTS API");
        setAudioUrl(null);
      }
    } catch (error) {
      toast.error("TTS demo failed: " + (error as Error).message);
      setAudioUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageDemo = async () => {
    if (!tempKey) {
      toast.error("Please wait, generating demo key...");
      return;
    }

    setLoading(true);
    setImageUrl(null);

    try {
      const result = await apiClient.testImageGen(imagePrompt);
      if (result.success && result.data?.image) {
        setImageUrl(`data:image/png;base64,${result.data.image}`);
        toast.success("Image generated successfully!");
      } else {
        const errorMsg = result.error || "Failed to generate image";
        if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("connect")) {
          toast.error("Image generation service is not running. Please start Stable Diffusion WebUI on port 7860.");
        } else {
          toast.error(errorMsg);
        }
        setImageUrl(null);
      }
    } catch (error) {
      toast.error("Image generation demo failed: " + (error as Error).message);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="demo" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <ParallaxSection offset={40} className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-accent text-gradient">
              Try It Live
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Experience the power of our AI services right here. 
            {tempKey && (
              <span className="block text-sm mt-2 text-primary">
                Demo API Key: {tempKey.substring(0, 20)}...
              </span>
            )}
          </motion.p>
        </ParallaxSection>

        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="relative mb-8">
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <div className="flex gap-4 min-w-max md:justify-center">
              {demoTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-primary text-white shadow-lg"
                      : "bg-card border border-border hover:bg-muted"
                  } ${!tab.available ? "opacity-50" : ""}`}
                  disabled={!tab.available}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {!tab.available && <span className="ml-1 text-xs">(Offline)</span>}
                  {tab.mock && <span className="ml-1 text-xs">(Mock)</span>}
                </button>
              ))}
            </div>
            </div>
            {/* Scroll indicator for mobile */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </div>

          {/* Demo Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-xl"
            >
              {/* Chat Demo */}
              {activeTab === "chat" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Prompt</label>
                    <textarea
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      className="w-full p-4 border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Ask anything..."
                    />
                  </div>
                  
                  <button
                    onClick={handleChatDemo}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {loading ? "Thinking..." : "Generate Response"}
                  </button>

                  {chatResponse && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-muted rounded-lg"
                    >
                      <p className="text-sm">{chatResponse}</p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* TTS Demo */}
              {activeTab === "tts" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Text to Speak</label>
                    <textarea
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      className="w-full p-4 border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Enter text to convert to speech..."
                    />
                  </div>
                  
                  <button
                    onClick={handleTTSDemo}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                    {loading ? "Generating..." : "Generate Speech"}
                  </button>

                  {audioUrl && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-muted rounded-lg"
                    >
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                      </audio>
                      <a
                        href={audioUrl}
                        download="speech.mp3"
                        className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        Download Audio
                      </a>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Image Demo */}
              {activeTab === "image" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Image Prompt</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="w-full p-4 border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={2}
                      placeholder="Describe the image you want..."
                    />
                  </div>
                  
                  <button
                    onClick={handleImageDemo}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    {loading ? "Creating..." : "Generate Image"}
                  </button>

                  {imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-lg overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt="Generated"
                        className="w-full h-auto"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Speech to Text Demo */}
              {activeTab === "stt" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Speech to Text Demo</label>
                    <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
                      <p className="text-muted-foreground mb-4">
                        Upload an audio file or record your voice
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                          Upload Audio
                        </button>
                        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity">
                          Record Voice
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                      Transcription will appear here
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}