import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Trash2, Copy } from "lucide-react";

interface QuestionCardProps {
  id: string;
  questionText: string;
  subject: string;
  difficultyScore?: number;
  uniquenessScore?: number;
  answer?: string;
  explanation?: string;
  createdAt?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export default function QuestionCard({
  id,
  questionText,
  subject,
  difficultyScore,
  uniquenessScore,
  answer,
  explanation,
  createdAt,
  onEdit,
  onDelete,
  onDuplicate,
}: QuestionCardProps) {
  const getDifficultyColor = (score?: number) => {
    if (!score) return "secondary";
    if (score <= 3) return "secondary"; // Easy - Green
    if (score <= 6) return "warning";   // Medium - Orange
    return "destructive";               // Hard - Red
  };

  const getDifficultyLabel = (score?: number) => {
    if (!score) return "Unknown";
    if (score <= 3) return "Easy";
    if (score <= 6) return "Medium";
    return "Hard";
  };

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`question-card-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-primary" />
            <Badge variant="outline">{subject}</Badge>
            {difficultyScore && (
              <Badge variant={getDifficultyColor(difficultyScore)}>
                {getDifficultyLabel(difficultyScore)} ({difficultyScore.toFixed(1)})
              </Badge>
            )}
            {uniquenessScore && (
              <Badge variant="outline">
                {(uniquenessScore * 100).toFixed(1)}% unique
              </Badge>
            )}
          </div>
          <div className="flex space-x-1">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(id)}
                data-testid={`duplicate-question-${id}`}
              >
                <Copy size={14} />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(id)}
                data-testid={`edit-question-${id}`}
              >
                <Edit size={14} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(id)}
                data-testid={`delete-question-${id}`}
              >
                <Trash2 size={14} className="text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Question</h4>
            <p className="text-gray-700 text-sm leading-relaxed" data-testid={`question-text-${id}`}>
              {questionText}
            </p>
          </div>
          
          {answer && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Answer</h4>
              <p className="text-gray-700 text-sm" data-testid={`question-answer-${id}`}>
                {answer}
              </p>
            </div>
          )}
          
          {explanation && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
              <p className="text-gray-600 text-sm leading-relaxed" data-testid={`question-explanation-${id}`}>
                {explanation}
              </p>
            </div>
          )}
          
          {createdAt && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Created: {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
