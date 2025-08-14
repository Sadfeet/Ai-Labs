import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, Scale, Shield, Clock, GraduationCap, TrendingUp, AlertTriangle } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import StatsCard from "@/components/ui/stats-card";
import ActivityFeed from "@/components/ui/activity-feed";
import ProgressBar from "@/components/ui/progress-bar";

interface DashboardStats {
  totalQuestions: number;
  activeStudents: number;
  avgDifficulty: number;
  uniquenessRate: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral" data-testid="dashboard-page">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* System Architecture Flow Section */}
        <section className="mb-12">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center">
                <Brain className="text-primary mr-3" size={24} />
                System Architecture Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
                <div className="flex flex-col space-y-6 min-w-[800px]">
                  {/* Input Layer */}
                  <div className="flex justify-center">
                    <div className="bg-accent text-white px-6 py-3 rounded-lg font-semibold text-center min-w-[200px]">
                      <GraduationCap className="inline mr-2" size={16} />
                      Question Templates Input
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <TrendingUp className="text-gray-400" size={24} />
                  </div>
                  
                  {/* Processing Layer */}
                  <div className="flex justify-center space-x-8">
                    <div className="bg-primary text-white px-4 py-3 rounded-lg text-center min-w-[180px]">
                      <Brain className="inline mr-2" size={16} />
                      AI Question Generator<br />
                      <span className="text-xs opacity-80">(OpenAI GPT-4)</span>
                    </div>
                    <div className="bg-secondary text-white px-4 py-3 rounded-lg text-center min-w-[180px]">
                      <Scale className="inline mr-2" size={16} />
                      Difficulty Analyzer<br />
                      <span className="text-xs opacity-80">(NLP Algorithm)</span>
                    </div>
                    <div className="bg-purple-600 text-white px-4 py-3 rounded-lg text-center min-w-[180px]">
                      <Shield className="inline mr-2" size={16} />
                      Uniqueness Validator<br />
                      <span className="text-xs opacity-80">(Similarity Check)</span>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <TrendingUp className="text-gray-400" size={24} />
                  </div>
                  
                  {/* Output Layer */}
                  <div className="flex justify-center space-x-8">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-lg text-center min-w-[150px]">
                      <GraduationCap className="inline mr-2" size={16} />
                      Student Interface<br />
                      <span className="text-xs opacity-80">(Question Delivery)</span>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg text-center min-w-[150px]">
                      <Users className="inline mr-2" size={16} />
                      Instructor Dashboard<br />
                      <span className="text-xs opacity-80">(Monitoring & Control)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Questions Generated"
            value={stats?.totalQuestions || 0}
            icon={Brain}
            trend="+12%"
            trendLabel="from last week"
            color="primary"
            data-testid="stats-total-questions"
          />
          
          <StatsCard
            title="Active Students"
            value={stats?.activeStudents || 0}
            icon={Users}
            trend="+5"
            trendLabel="new this week"
            color="secondary"
            data-testid="stats-active-students"
          />
          
          <StatsCard
            title="Avg Difficulty Score"
            value={stats?.avgDifficulty?.toFixed(1) || "0.0"}
            icon={Scale}
            trendLabel="Optimal range: 7-8"
            color="accent"
            data-testid="stats-avg-difficulty"
          />
          
          <StatsCard
            title="Uniqueness Rate"
            value={`${stats?.uniquenessRate?.toFixed(1) || "0.0"}%`}
            icon={Shield}
            trend="Excellent"
            trendLabel="Above target"
            color="success"
            data-testid="stats-uniqueness-rate"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* AI Question Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="text-primary mr-2" size={20} />
                AI Question Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" data-testid="question-generator-form">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Area</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" data-testid="select-subject">
                    <option>Chemistry Lab</option>
                    <option>Physics Lab</option>
                    <option>Biology Lab</option>
                    <option>Computer Science</option>
                    <option>Mathematics</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Template</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24" 
                    placeholder="Enter your base question template here..."
                    data-testid="textarea-template"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Variants</label>
                    <input 
                      type="number" 
                      defaultValue="25" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      data-testid="input-variants"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" data-testid="select-difficulty">
                      <option>Intermediate</option>
                      <option>Beginner</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  data-testid="button-generate"
                >
                  <Brain className="inline mr-2" size={16} />
                  Generate Questions
                </button>
              </form>
              
              {/* Generation Status */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-primary rounded-full animate-pulse mr-3"></div>
                    <span className="text-sm font-medium text-blue-700">Ready to generate...</span>
                  </div>
                </div>
                <ProgressBar value={0} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <ActivityFeed />
        </div>

        {/* System Requirements Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center">
                <Clock className="text-primary mr-3" size={24} />
                System Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Functional Requirements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Brain className="text-secondary mr-2" size={20} />
                    Functional Requirements
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">AI-powered question generation using OpenAI GPT-4 API</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Unique question assignment algorithm (no duplicates)</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Difficulty assessment and normalization system</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Question template management system</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Student assignment and progress tracking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Automated evaluation and scoring system</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Plagiarism detection for question uniqueness</span>
                    </li>
                  </ul>
                </div>
                
                {/* Technical Requirements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <AlertTriangle className="text-accent mr-2" size={20} />
                    Technical Requirements
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Node.js backend with Express and REST API</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">PostgreSQL database for data persistence</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">React.js responsive web interface</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">OpenAI API integration for AI generation</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Natural Language Processing for similarity detection</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Scalability for 100+ concurrent users</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                      <span className="text-gray-700">Comprehensive logging and audit trail system</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Dataset Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Shield className="text-primary mr-3" size={24} />
              Dataset Sources & Implementation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Dataset Sources */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Datasets</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">1. STEM Question Templates</h4>
                    <p className="text-gray-600 text-sm mb-2">Pre-built question templates for various STEM subjects</p>
                    <p className="text-primary text-sm font-medium">Source: Educational Testing Service (ETS) Open Datasets</p>
                    <p className="text-xs text-gray-500">URL: https://www.ets.org/research/data/</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">2. Scientific Vocabulary Database</h4>
                    <p className="text-gray-600 text-sm mb-2">Comprehensive scientific terms and concepts</p>
                    <p className="text-primary text-sm font-medium">Source: WordNet Scientific Domain</p>
                    <p className="text-xs text-gray-500">URL: https://wordnet.princeton.edu/</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">3. Difficulty Assessment Data</h4>
                    <p className="text-gray-600 text-sm mb-2">Question difficulty metrics and rubrics</p>
                    <p className="text-primary text-sm font-medium">Source: Khan Academy Exercise Data</p>
                    <p className="text-xs text-gray-500">URL: https://github.com/Khan/khan-exercises</p>
                  </div>
                </div>
              </div>
              
              {/* Implementation Steps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Implementation Steps</h3>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Setup Environment</h4>
                    <p className="text-gray-600 text-sm">Install dependencies: Node.js, PostgreSQL, OpenAI API</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Load Datasets</h4>
                    <p className="text-gray-600 text-sm">Import question templates and vocabulary into database</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Deploy System</h4>
                    <p className="text-gray-600 text-sm">Launch web application with AI question generation pipeline</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
