import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Shield } from 'lucide-react';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 pagion-gradient flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card p-6 rounded-3xl shadow-2xl mb-6 animate-slide-up">
          <Logo size="xl" showText={false} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 animate-fade-in">
          Pagion
        </h1>
        
        <p className="text-white/90 text-lg md:text-xl mb-8 max-w-md animate-fade-in">
          Fast as a pigeon, reliable as a pager.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="bg-card py-12 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full pagion-gradient flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Instant Messaging</h3>
            <p className="text-muted-foreground text-sm">Send messages in real-time with edit and reply features.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full pagion-gradient flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Easy Connections</h3>
            <p className="text-muted-foreground text-sm">Add contacts using simple UIDs. No phone numbers needed.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full pagion-gradient flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Private & Secure</h3>
            <p className="text-muted-foreground text-sm">Your conversations stay between you and your contacts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
