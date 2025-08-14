import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, UserPlus, AlertTriangle, BarChart3 } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "success" | "info" | "warning" | "analytics";
  title: string;
  description: string;
  timestamp: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "success",
    title: "Questions generated for Chemistry Lab 101",
    description: "25 unique variants created for molecular calculations",
    timestamp: "2 minutes ago"
  },
  {
    id: "2",
    type: "info",
    title: "New student enrolled",
    description: "Sarah Johnson joined Physics Lab 201",
    timestamp: "15 minutes ago"
  },
  {
    id: "3",
    type: "warning",
    title: "Similarity alert detected",
    description: "High similarity between 2 generated questions",
    timestamp: "1 hour ago"
  },
  {
    id: "4",
    type: "analytics",
    title: "Analytics report generated",
    description: "Weekly performance summary available",
    timestamp: "3 hours ago"
  }
];

export default function ActivityFeed() {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={16} className="text-green-600" />;
      case "info":
        return <UserPlus size={16} className="text-blue-600" />;
      case "warning":
        return <AlertTriangle size={16} className="text-orange-600" />;
      case "analytics":
        return <BarChart3 size={16} className="text-purple-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100";
      case "info":
        return "bg-blue-100";
      case "warning":
        return "bg-orange-100";
      case "analytics":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="text-secondary mr-2" size={20} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              data-testid={`activity-item-${activity.id}`}
            >
              <div className={`w-8 h-8 ${getBgColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button
          variant="ghost"
          className="w-full mt-4 text-primary text-sm font-medium hover:text-blue-700 transition-colors"
          data-testid="view-all-activities"
        >
          View All Activities
        </Button>
      </CardContent>
    </Card>
  );
}
