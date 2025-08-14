import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Clock, Save, Send, CheckCircle, AlertCircle } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StudentAssignment {
  id: string;
  assignmentId: string;
  studentId: string;
  questionId: string;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  studentAnswer?: string;
  workShown?: string;
  score?: number;
  feedback?: string;
  timeSpent?: number;
  attempts: number;
  question?: {
    id: string;
    questionText: string;
    answer?: string;
    explanation?: string;
  };
  assignment?: {
    title: string;
    timeLimit?: number;
    maxAttempts: number;
  };
}

export default function StudentInterface() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; workShown: string; units: string }>>({});
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const { toast } = useToast();

  // Mock student ID - in a real app, this would come from authentication
  const studentId = "student-123";

  const { data: assignments, isLoading } = useQuery<StudentAssignment[]>({
    queryKey: ["/api/student-assignments", { studentId }],
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; answer: string; workShown: string }) => {
      return apiRequest("PATCH", `/api/student-assignments/${data.assignmentId}`, {
        studentAnswer: data.answer,
        workShown: data.workShown,
        status: "in_progress"
      });
    },
    onSuccess: () => {
      toast({ title: "Draft saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error saving draft", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; answer: string; workShown: string }) => {
      return apiRequest("PATCH", `/api/student-assignments/${data.assignmentId}`, {
        studentAnswer: data.answer,
        workShown: data.workShown,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        timeSpent: (45 * 60) - timeRemaining
      });
    },
    onSuccess: () => {
      toast({ title: "Answer submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/student-assignments"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error submitting answer", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  const activeAssignments = assignments?.filter(a => a.status === "assigned" || a.status === "in_progress") || [];
  const currentAssignment = activeAssignments[currentQuestionIndex];

  const handleAnswerChange = (field: "answer" | "workShown" | "units", value: string) => {
    if (!currentAssignment) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentAssignment.id]: {
        ...prev[currentAssignment.id],
        [field]: value
      }
    }));
  };

  const handleSaveDraft = () => {
    if (!currentAssignment) return;
    
    const currentAnswer = answers[currentAssignment.id];
    saveDraftMutation.mutate({
      assignmentId: currentAssignment.id,
      answer: currentAnswer?.answer || "",
      workShown: currentAnswer?.workShown || ""
    });
  };

  const handleSubmitAnswer = () => {
    if (!currentAssignment) return;
    
    const currentAnswer = answers[currentAssignment.id];
    if (!currentAnswer?.answer) {
      toast({ 
        title: "Please provide an answer before submitting",
        variant: "destructive"
      });
      return;
    }

    submitAnswerMutation.mutate({
      assignmentId: currentAssignment.id,
      answer: currentAnswer.answer,
      workShown: currentAnswer.workShown || ""
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral" data-testid="student-interface-page">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Student Question Interface */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="text-secondary mr-2" size={20} />
                  Student Question Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Assignments</h3>
                    <p className="text-gray-500">You don't have any active assignments at the moment.</p>
                  </div>
                ) : (
                  <>
                    {/* Assignment Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900" data-testid="assignment-title">
                          {currentAssignment?.assignment?.title || "Lab Assignment"}
                        </h4>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {currentAssignment?.status === "in_progress" ? "In Progress" : "Active"}
                        </span>
                      </div>
                      
                      {/* Question Card */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <h5 className="font-medium text-gray-900 mb-2" data-testid="question-number">
                          Question {currentQuestionIndex + 1} of {activeAssignments.length}
                        </h5>
                        <p className="text-gray-700 mb-4" data-testid="question-text">
                          {currentAssignment?.question?.questionText || "Loading question..."}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer</label>
                            <Input
                              value={answers[currentAssignment?.id || ""]?.answer || ""}
                              onChange={(e) => handleAnswerChange("answer", e.target.value)}
                              placeholder="Enter your answer..."
                              data-testid="input-answer"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
                            <Select
                              value={answers[currentAssignment?.id || ""]?.units || ""}
                              onValueChange={(value) => handleAnswerChange("units", value)}
                            >
                              <SelectTrigger data-testid="select-units">
                                <SelectValue placeholder="Select units" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M">M (Molar)</SelectItem>
                                <SelectItem value="mM">mM (Millimolar)</SelectItem>
                                <SelectItem value="μM">μM (Micromolar)</SelectItem>
                                <SelectItem value="g">g (Grams)</SelectItem>
                                <SelectItem value="kg">kg (Kilograms)</SelectItem>
                                <SelectItem value="L">L (Liters)</SelectItem>
                                <SelectItem value="mL">mL (Milliliters)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Show Your Work</label>
                          <Textarea
                            value={answers[currentAssignment?.id || ""]?.workShown || ""}
                            onChange={(e) => handleAnswerChange("workShown", e.target.value)}
                            placeholder="Explain your calculation steps..."
                            className="h-24"
                            data-testid="textarea-work"
                          />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">Time Remaining:</span>
                          <div className="flex items-center space-x-2">
                            <Clock size={16} className="text-accent" />
                            <span className="font-medium text-accent" data-testid="time-remaining">
                              {formatTime(timeRemaining)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button 
                            variant="outline" 
                            onClick={handleSaveDraft}
                            disabled={saveDraftMutation.isPending}
                            data-testid="button-save-draft"
                          >
                            <Save className="mr-2" size={16} />
                            {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                          </Button>
                          <Button 
                            onClick={handleSubmitAnswer}
                            disabled={submitAnswerMutation.isPending}
                            data-testid="button-submit"
                          >
                            <Send className="mr-2" size={16} />
                            {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        data-testid="button-previous"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Progress:</span>
                        <div className="flex space-x-1">
                          {activeAssignments.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full ${
                                index === currentQuestionIndex ? "bg-primary" : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(Math.min(activeAssignments.length - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === activeAssignments.length - 1}
                        data-testid="button-next"
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Assignment Status */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="text-success mr-2" size={20} />
                  Assignment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments?.map((assignment, index) => (
                    <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'submitted' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          assignment.status === 'graded' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>
                      {assignment.score !== undefined && assignment.score !== null && (
                        <div className="text-sm text-gray-600">
                          Score: {assignment.score}/100
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Attempts: {assignment.attempts}/{assignment.assignment?.maxAttempts || 1}
                      </div>
                    </div>
                  ))}
                  
                  {assignments && assignments.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      No assignments found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
