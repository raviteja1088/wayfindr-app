import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Play, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [bus, setBus] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusInfo();
  }, [user]);

  const fetchBusInfo = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .eq('driver_id', user.id)
      .single();

    if (error) {
      toast.error('Failed to fetch bus information');
    } else {
      setBus(data);
    }
    setLoading(false);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    if (!bus) {
      toast.error('No bus assigned to you');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Insert location into database
        const { error } = await supabase.from('bus_locations').insert([
          {
            bus_id: bus.id,
            latitude,
            longitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
          },
        ]);

      if (error) {
        toast.error('Failed to update location');
      }
      },
      (error) => {
        toast.error('Unable to access location');
        toast.error('Failed to get your location');
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success('GPS tracking started');
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.info('GPS tracking stopped');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Driver Dashboard" />
      
      <main className="container py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Bus Information</CardTitle>
              <CardDescription>Assigned bus details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bus Number</span>
                    <span className="font-medium">{bus.bus_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Route</span>
                    <span className="font-medium">{bus.route_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={bus.is_active ? 'bg-tracking-active' : 'bg-tracking-offline'}>
                      {bus.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">No bus assigned yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GPS Tracking</CardTitle>
              <CardDescription>Share your live location with students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Navigation className={isTracking ? 'h-5 w-5 animate-pulse text-tracking-active' : 'h-5 w-5 text-muted-foreground'} />
                  <div>
                    <p className="font-medium">GPS Status</p>
                    <p className="text-sm text-muted-foreground">
                      {isTracking ? 'Broadcasting location' : 'Not tracking'}
                    </p>
                  </div>
                </div>
                <Badge className={isTracking ? 'bg-tracking-active' : 'bg-tracking-offline'}>
                  {isTracking ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {!isTracking ? (
                <Button onClick={startTracking} className="w-full" disabled={!bus}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Tracking
                </Button>
              ) : (
                <Button onClick={stopTracking} variant="destructive" className="w-full">
                  <Square className="mr-2 h-4 w-4" />
                  Stop Tracking
                </Button>
              )}

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="mb-2 font-medium">Tips:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Keep the app open while tracking</li>
                  <li>• Ensure GPS is enabled on your device</li>
                  <li>• Location updates every few seconds</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
              <CardDescription>Your current location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Map will be displayed here when tracking starts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
