import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: string;
  full_name: string;
  profiles: {
    full_name: string;
    phone: string | null;
  };
  user_roles: {
    role: string;
  }[];
}

interface UsersManagementProps {
  onUpdate: () => void;
}

export const UsersManagement = ({ onUpdate }: UsersManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        role,
        user_id,
        profiles:user_id (
          full_name,
          phone
        )
      `);

    if (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } else {
      // Group by user_id to combine roles
      const usersMap = new Map();
      data?.forEach((item: any) => {
        const userId = item.user_id;
        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            full_name: item.profiles?.full_name || 'Unknown',
            profiles: item.profiles,
            user_roles: [{ role: item.role }],
          });
        } else {
          usersMap.get(userId).user_roles.push({ role: item.role });
        }
      });
      
      setUsers(Array.from(usersMap.values()));
    }
    setLoading(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary text-primary-foreground';
      case 'driver':
        return 'bg-accent text-accent-foreground';
      case 'student':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Users Management</CardTitle>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role(s)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.profiles?.full_name}</TableCell>
                  <TableCell>{user.profiles?.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.user_roles?.map((ur, idx) => (
                        <Badge key={idx} className={getRoleBadgeColor(ur.role)}>
                          {ur.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
