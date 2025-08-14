import { Link, useLocation } from "wouter";
import { Brain, BarChart3, Settings, Users, FileText, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/generator", label: "Questions", icon: FileText },
    { path: "/student", label: "Students", icon: Users },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50" data-testid="navigation-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center" data-testid="logo-link">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">AI Lab Generator</h1>
                <p className="text-sm text-gray-500">Intelligent Assessment Platform</p>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path === "/dashboard" && location === "/");
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-1 pb-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  <div className="flex items-center space-x-1">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="notifications-button">
              <Bell size={18} className="text-gray-400 hover:text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="profile-button">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
