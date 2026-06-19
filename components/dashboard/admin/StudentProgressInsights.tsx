'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Brain, Loader2, User, Calendar } from 'lucide-react';
import { analyzeStudentProgressStream } from '@/app/actions/ai';
import { logger } from '@/lib/logger';

interface Student {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  students: Student[];
}

export function StudentProgressInsights({ students }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<string>('last_30_days');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');

  const handleAnalyze = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setInsights(''); // Clear previous insights

    try {
      // Streaming server action returns a Promise resolving to the async
      // iterable, so it must be awaited before iterating.
      const streamGenerator = await analyzeStudentProgressStream({
        studentData: { studentId: selectedStudent },
        timePeriod:
          timePeriod === 'last_30_days'
            ? 'Last 30 days'
            : timePeriod === 'last_90_days'
              ? 'Last 90 days'
              : 'All time',
      });

      for await (const chunk of streamGenerator) {
        setInsights(String(chunk));
      }
    } catch (error) {
      logger.error('Error analyzing student progress:', error);
      setInsights('An error occurred while analyzing progress.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          AI Progress Insights
        </CardTitle>
        <CardDescription>
          Get detailed AI analysis of student learning patterns and progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Student</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {student.full_name || student.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_30_days">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last 30 days
                  </div>
                </SelectItem>
                <SelectItem value="last_90_days">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last 90 days
                  </div>
                </SelectItem>
                <SelectItem value="all_time">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    All time
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAnalyze} disabled={loading || !selectedStudent} className="w-full">
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4 mr-2" />
          )}
          Analyze Progress
        </Button>

        {selectedStudentData && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {selectedStudentData.full_name || selectedStudentData.email}
              </span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{timePeriod.replace('_', ' ')}</Badge>
            </div>
          </div>
        )}

        {insights && (
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Insights:</label>
            <div className="p-4 bg-muted rounded-lg border">
              <div className="whitespace-pre-wrap text-sm">{insights}</div>
            </div>
          </div>
        )}

        {!selectedStudent && (
          <p className="text-sm text-muted-foreground text-center">
            Select a student to analyze their learning progress with AI
          </p>
        )}
      </CardContent>
    </Card>
  );
}
