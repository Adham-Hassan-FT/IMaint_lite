import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, MoreVertical, Users, Calendar, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ResourceList() {
  const { data: users, isLoading, isError } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get work orders for assignment statistics
  const { data: workOrders } = useQuery({
    queryKey: ['/api/work-orders/details'],
  });

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load resources. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate assigned work orders for each user
  const getAssignedWorkOrderCount = (userId: number) => {
    if (!workOrders) return 0;
    return workOrders.filter(wo => wo.assignedToId === userId).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Resources
          </h2>
          <p className="text-muted-foreground">
            Manage technicians and staff resources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
          <Button>
            Add Resource
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full my-2" />
                <Skeleton className="h-4 w-3/4 my-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : (
          users?.map(user => (
            <Card key={user.id} className="hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {user.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Assign Work</DropdownMenuItem>
                      <DropdownMenuItem>Schedule</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Assigned Work Orders:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800">
                      {getAssignedWorkOrderCount(user.id)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={user.isActive ? "bg-green-50 text-green-800" : "bg-gray-100"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Assign Work Order
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {users?.length === 0 && (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No resources found</h3>
          <p className="text-muted-foreground mt-2">
            Get started by adding technicians and staff members.
          </p>
          <Button className="mt-4">
            Add Resource
          </Button>
        </div>
      )}
    </div>
  );
}
