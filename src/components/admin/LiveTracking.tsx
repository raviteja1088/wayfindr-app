import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export const LiveTracking = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Bus Tracking</CardTitle>
        <CardDescription>Real-time locations of all active buses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Google Maps integration will be displayed here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your Google Maps API key to enable live tracking
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
