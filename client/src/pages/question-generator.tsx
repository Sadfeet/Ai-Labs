import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Wand2, Database, Settings, Loader2 } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import QuestionCard from "@/components/ui/question-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QuestionTemplate {
  id: string;
  title: string;
  subject: string;
  template: string;
  variables: any;
  difficultyLevel: string;
  createdAt: string;
  isActive: boolean;
}

interface GeneratedQuestion {
  id: string;
  templateId: string;
  questionText: string;
  answer?: string;
  explanation?: string;
  difficultyScore?: number;
  uniquenessScore?: number;
  metadata: any;
  createdAt: string;
}

export default function QuestionGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [numVariants, setNumVariants] = useState(5);
  const [targetDifficulty, setTargetDifficulty] = useState("");
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    subject: "Chemistry Lab",
    template: "",
    difficultyLevel: "intermediate",
    variables: {}
  });
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const { toast } = useToast();

  const { data: templates, isLoading: templatesLoading } = useQuery<QuestionTemplate[]>({
    queryKey: ["/api/question-templates"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<GeneratedQuestion[]>({
    queryKey: ["/api/questions"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      return apiRequest("POST", "/api/question-templates", templateData);
    },
    onSuccess: () => {
      toast({ title: "Template created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/question-templates"] });
      setShowCreateTemplate(false);
      setNewTemplate({
        title: "",
        subject: "Chemistry Lab",
        template: "",
        difficultyLevel: "intermediate",
        variables: {}
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async (data: {
      templateId: string;
      numVariants: number;
      targetDifficulty?: number;
      ensureUniqueness: boolean;
    }) => {
      return apiRequest("POST", "/api/questions/generate", data);
    },
    onSuccess: (data) => {
      toast({ 
        title: "Questions generated successfully",
        description: `Generated ${data.statistics.generated} questions with ${data.statistics.rejectedDuplicates} duplicates rejected`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error generating questions",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const generateTemplateMutation = useMutation({
    mutationFn: async (data: { subject: string; topic: string; difficultyLevel: string }) => {
      return apiRequest("POST", "/api/question-templates/generate", data);
    },
    onSuccess: (data) => {
      setNewTemplate(prev => ({ ...prev, template: data.template }));
      toast({ title: "Template generated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error generating template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const handleGenerateQuestions = () => {
    if (!selectedTemplate) {
      toast({
        title: "Please select a template",
        variant: "destructive"
      });
      return;
    }

    generateQuestionsMutation.mutate({
      templateId: selectedTemplate,
      numVariants,
      targetDifficulty: targetDifficulty ? parseFloat(targetDifficulty) : undefined,
      ensureUniqueness: true
    });
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.title || !newTemplate.template) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createTemplateMutation.mutate(newTemplate);
  };

  const handleGenerateTemplate = () => {
    const topic = "general calculations"; // This could be an input field
    generateTemplateMutation.mutate({
      subject: newTemplate.subject,
      topic,
      difficultyLevel: newTemplate.difficultyLevel
    });
  };

  return (
    <div className="min-h-screen bg-neutral" data-testid="question-generator-page">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Generator</h1>
            <p className="text-gray-600 mt-2">Generate unique AI-powered lab questions</p>
          </div>
          <Button
            onClick={() => setShowCreateTemplate(!showCreateTemplate)}
            data-testid="button-create-template"
          >
            <Plus className="mr-2" size={16} />
            Create Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Question Generation Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Create Template Form */}
            {showCreateTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wand2 className="text-accent mr-2" size={20} />
                    Create New Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <Input
                          value={newTemplate.title}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Template title..."
                          data-testid="input-template-title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <Select
                          value={newTemplate.subject}
                          onValueChange={(value) => setNewTemplate(prev => ({ ...prev, subject: value }))}
                        >
                          <SelectTrigger data-testid="select-template-subject">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Chemistry Lab">Chemistry Lab</SelectItem>
                            <SelectItem value="Physics Lab">Physics Lab</SelectItem>
                            <SelectItem value="Biology Lab">Biology Lab</SelectItem>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Template
                        <span className="text-gray-500 ml-2">(Use {"{variable}"} for dynamic parts)</span>
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <Textarea
                          value={newTemplate.template}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
                          placeholder="e.g., Calculate the molarity of {compound} in {volume}mL of solution..."
                          className="flex-1 h-24"
                          data-testid="textarea-template"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateTemplate}
                          disabled={generateTemplateMutation.isPending}
                          data-testid="button-generate-template"
                        >
                          <Wand2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                      <Select
                        value={newTemplate.difficultyLevel}
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, difficultyLevel: value }))}
                      >
                        <SelectTrigger data-testid="select-template-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        onClick={handleCreateTemplate}
                        disabled={createTemplateMutation.isPending}
                        data-testid="button-save-template"
                      >
                        {createTemplateMutation.isPending && <Loader2 className="mr-2" size={16} />}
                        Save Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateTemplate(false)}
                        data-testid="button-cancel-template"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Question Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="text-primary mr-2" size={20} />
                  Generate Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger data-testid="select-template">
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.title} ({template.subject})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Variants</label>
                      <Input
                        type="number"
                        value={numVariants}
                        onChange={(e) => setNumVariants(parseInt(e.target.value) || 5)}
                        min="1"
                        max="50"
                        data-testid="input-variants"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Difficulty (Optional)</label>
                      <Input
                        type="number"
                        value={targetDifficulty}
                        onChange={(e) => setTargetDifficulty(e.target.value)}
                        min="1"
                        max="10"
                        step="0.1"
                        placeholder="1-10 scale"
                        data-testid="input-target-difficulty"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={generateQuestionsMutation.isPending}
                    className="w-full"
                    data-testid="button-generate-questions"
                  >
                    {generateQuestionsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2" size={16} />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </form>
                
                {generateQuestionsMutation.data && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Generation Results</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>✓ Generated: {generateQuestionsMutation.data.statistics.generated} questions</p>
                      <p>✓ Average Difficulty: {generateQuestionsMutation.data.statistics.avgDifficulty.toFixed(1)}</p>
                      <p>✓ Average Uniqueness: {(generateQuestionsMutation.data.statistics.avgUniqueness * 100).toFixed(1)}%</p>
                      {generateQuestionsMutation.data.statistics.rejectedDuplicates > 0 && (
                        <p>⚠ Rejected Duplicates: {generateQuestionsMutation.data.statistics.rejectedDuplicates}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="text-secondary mr-2" size={20} />
                  Generated Questions
                  {questions && (
                    <Badge variant="secondary" className="ml-2">
                      {questions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : questions && questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.slice(0, 10).map((question) => (
                      <QuestionCard
                        key={question.id}
                        id={question.id}
                        questionText={question.questionText}
                        subject={question.metadata?.originalTemplate || "Unknown"}
                        difficultyScore={question.difficultyScore}
                        uniquenessScore={question.uniquenessScore}
                        answer={question.answer}
                        explanation={question.explanation}
                        createdAt={question.createdAt}
                      />
                    ))}
                    {questions.length > 10 && (
                      <div className="text-center py-4">
                        <Button variant="outline" data-testid="load-more-questions">
                          Load More Questions
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Brain size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Questions Generated Yet</h3>
                    <p>Select a template and generate your first set of questions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Templates Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="text-accent mr-2" size={20} />
                  Question Templates
                  {templates && (
                    <Badge variant="outline" className="ml-2">
                      {templates.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : templates && templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate === template.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                        data-testid={`template-${template.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {template.difficultyLevel}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.template.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Settings size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No templates found</p>
                    <p className="text-xs">Create your first template above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
