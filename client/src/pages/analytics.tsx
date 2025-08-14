import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingUp, Users, Brain, Shield, Clock } from "lucide-react";
import Navigation from "@/components/ui/navigation";

interface Analytics {
  id: string;
  subject: string;
  questionsGenerated: number;
  avgDifficulty: number;
  avgUniquenessScore: number;
  avgStudentPerformance: number;
  date: string;
}

interface QuestionStatistics {
  totalQuestions: number;
  avgDifficulty: number;
  avgUniqueness: number;
  difficultyDistribution: Record<string, number>;
}

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
  });

  const { data: questionStats, isLoading: statsLoading } = useQuery<QuestionStatistics>({
    queryKey: ["/api/questions/statistics"],
  });

  if (analyticsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Process analytics data for display
  const subjectAnalytics = analytics?.reduce((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = {
        questionsGenerated: 0,
        avgDifficulty: 0,
        avgUniqueness: 0,
        avgPerformance: 0,
        count: 0
      };
    }
    acc[item.subject].questionsGenerated += item.questionsGenerated || 0;
    acc[item.subject].avgDifficulty += item.avgDifficulty || 0;
    acc[item.subject].avgUniqueness += item.avgUniquenessScore || 0;
    acc[item.subject].avgPerformance += item.avgStudentPerformance || 0;
    acc[item.subject].count += 1;
    return acc;
  }, {} as Record<string, any>) || {};

  // Calculate averages
  Object.keys(subjectAnalytics).forEach(subject => {
    const data = subjectAnalytics[subject];
    data.avgDifficulty = data.avgDifficulty / data.count;
    data.avgUniqueness = data.avgUniqueness / data.count;
    data.avgPerformance = data.avgPerformance / data.count;
  });

  const totalQuestions = Object.values(subjectAnalytics).reduce((sum: number, data: any) => sum + data.questionsGenerated, 0);
  const overallAvgDifficulty = Object.values(subjectAnalytics).reduce((sum: number, data: any) => sum + data.avgDifficulty, 0) / Object.keys(subjectAnalytics).length || 0;
  const overallAvgUniqueness = Object.values(subjectAnalytics).reduce((sum: number, data: any) => sum + data.avgUniqueness, 0) / Object.keys(subjectAnalytics).length || 0;

  return (
    <div className="min-h-screen bg-neutral" data-testid="analytics-page">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Performance Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into question generation and student performance</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="total-questions">
                    {questionStats?.totalQuestions || totalQuestions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Brain className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Difficulty</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="avg-difficulty">
                    {(questionStats?.avgDifficulty || overallAvgDifficulty).toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Uniqueness</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="avg-uniqueness">
                    {((questionStats?.avgUniqueness || overallAvgUniqueness) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Shield className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subjects Covered</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="subjects-covered">
                    {Object.keys(subjectAnalytics).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-secondary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Difficulty Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="text-accent mr-2" size={20} />
                Question Difficulty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionStats?.difficultyDistribution ? (
                  Object.entries(questionStats.difficultyDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                          level.includes('Easy') ? 'bg-success' :
                          level.includes('Medium') ? 'bg-warning' :
                          'bg-error'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">{level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{count}</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              level.includes('Easy') ? 'bg-success' :
                              level.includes('Medium') ? 'bg-warning' :
                              'bg-error'
                            }`}
                            style={{ 
                              width: `${(count / (questionStats.totalQuestions || 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No difficulty distribution data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Analytics Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="text-primary mr-2" size={20} />
                Recent Analytics Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics && analytics.length > 0 ? (
                  analytics.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{item.subject}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Generated: {item.questionsGenerated || 0} questions
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-700">
                          Diff: {(item.avgDifficulty || 0).toFixed(1)}
                        </div>
                        <div className="text-gray-700">
                          Uniq: {((item.avgUniquenessScore || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No recent analytics data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="text-purple-600 mr-2" size={20} />
              Subject Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uniqueness Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(subjectAnalytics).map(([subject, data]) => (
                    <tr key={subject} data-testid={`subject-row-${subject.toLowerCase().replace(/\s+/g, '-')}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Badge variant="outline">{subject}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.questionsGenerated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.avgDifficulty.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(data.avgUniqueness * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.avgPerformance > 0 ? `${data.avgPerformance.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {Object.keys(subjectAnalytics).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No subject analytics data available</p>
                        <p className="text-sm mt-1">Start generating questions to see analytics</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
