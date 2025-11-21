import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bus as BusIcon, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignedBus, setAssignedBus] = useState<any>(null);
  const [busLocation, setBusLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedBus();
  }, [user]);

  useEffect(() => {
    if (!assignedBus) return;

    // Subscribe to bus location updates
    const channel = supabase
      .channel('bus-location-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bus_locations',
          filter: `bus_id=eq.${assignedBus.id}`,
        },
        (payload) => {
          setBusLocation(payload.new);
          checkProximity(payload.new);
        }
      )
      .subscribe();

    // Fetch initial location
    fetchLatestLocation();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignedBus]);

  const fetchAssignedBus = async () => {
    if (!user) return;

    const { data: assignment } = await supabase
      .from('student_bus_assignments')
      .select(`
        bus_id,
        buses (
          id,
          bus_number,
          route_name,
          is_active
        )
      `)
      .eq('student_id', user.id)
      .single();

    if (assignment) {
      setAssignedBus(assignment.buses);
    }
    setLoading(false);
  };

  const fetchLatestLocation = async () => {
    if (!assignedBus) return;

    const { data } = await supabase
      .from('bus_locations')
      .select('*')
      .eq('bus_id', assignedBus.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setBusLocation(data);
    }
  };

  const checkProximity = async (location: any) => {
    // Get user's stop location
    const { data: profile } = await supabase
      .from('profiles')
      .select('stop_latitude, stop_longitude, stop_name')
      .eq('id', user?.id)
      .single();

    if (profile?.stop_latitude && profile?.stop_longitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        profile.stop_latitude,
        profile.stop_longitude
      );

      // Alert if within 500 meters
      if (distance <= 0.5) {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Bus Arriving!', {
            body: `Your bus is approaching ${profile.stop_name}`,
            icon: '/favicon.ico',
          });
        }

        // Play sound
        const audio = new Audio('/beep.mp3');
      audio.play().catch(() => {
        // Audio playback failed - user interaction may be required
      });

        // Show toast
        toast.success(`Bus is approaching ${profile.stop_name}!`, {
          duration: 10000,
        });
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Student Dashboard" />
      
      <main className="container py-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Bus</CardTitle>
              <CardDescription>Assigned bus information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedBus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bus Number</span>
                    <span className="font-medium">{assignedBus.bus_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Route</span>
                    <span className="font-medium">{assignedBus.route_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={assignedBus.is_active ? 'bg-tracking-active' : 'bg-tracking-offline'}>
                      {assignedBus.is_active ? 'Active' : 'Inactive'}
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
              <CardTitle>Bus Location</CardTitle>
              <CardDescription>Real-time tracking status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {busLocation ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <MapPin className="h-5 w-5 text-tracking-active" />
                    <div>
                      <p className="text-sm font-medium">Last Update</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(busLocation.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="mb-1 text-muted-foreground">Coordinates</p>
                    <p className="font-mono text-xs">
                      {busLocation.latitude.toFixed(6)}, {busLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Waiting for bus location...
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>Proximity notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg bg-warning/10 p-3">
                <Bell className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">Alert Enabled</p>
                  <p className="text-xs text-muted-foreground">
                    You'll be notified when the bus is 500m away
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Live Tracking Map</CardTitle>
              <CardDescription>Track your bus in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[500px] items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <BusIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Live bus tracking map will be displayed here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add Google Maps API key to enable live tracking
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

export default StudentDashboard;
