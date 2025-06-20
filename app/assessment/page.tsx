"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Brain,
  BookOpen,
} from "lucide-react";
import { TopNavLayout } from "@/components/layout/top-nav-layout";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User, Resource } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function AssessmentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeling, setFeeling] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentiment, setSentiment] = useState<null | {
    sentiment: string;
    score: number;
    riskLevel?: string;
    predicted_tags?: string[];
    requires_mental_health_professional?: boolean;
  }>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);
      } catch (error) {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const submitAssessment = async () => {
    setIsSubmitting(true);
    setError(null);
    setSentiment(null);
    try {
      const res = await fetch("/api/analyze-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeling }),
      });
      if (!res.ok) throw new Error("Failed to analyze sentiment.");
      const data = await res.json();
      setSentiment(data);
      setSuccess(true);

      // Save assessment result to database as an assessment with well_score
      if (user) {
        // Get student_id for the user
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (studentError || !student) {
          throw new Error(
            "Student profile not found. Please complete your profile setup."
          );
        }
        // Insert assessment
        const { error: insertError } = await supabase
          .from("assessments")
          .insert([
            {
              student_id: student.id,
              responses: { feeling },
              wellness_score: data.score, // use wellness_score
              requires_mental_health_professional:
                data.requires_mental_health_professional || null,
              risk_level: data.riskLevel || null,
              // Add other fields as needed
            },
          ]);
        if (insertError) {
          console.log(insertError);
          throw new Error("Failed to save assessment result.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Fetch resources when sentiment.predicted_tags changes
    const fetchResources = async () => {
      if (
        sentiment &&
        sentiment.predicted_tags &&
        sentiment.predicted_tags.length > 0
      ) {
        const { data, error } = await supabase
          .from("resources")
          .select(
            "id, title, description, url, resource_type, category, tags, is_featured, created_at"
          )
          .overlaps("tags", sentiment.predicted_tags);
        if (!error && data) {
          setResources(data);
        } else {
          setResources([]);
        }
      } else {
        setResources([]);
      }
    };
    fetchResources();
  }, [sentiment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <TopNavLayout user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                How are you feeling today?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="Describe your feelings..."
                className="min-h-[120px]"
                disabled={isSubmitting || success}
              />
              <div className="flex justify-end mt-8">
                <Button
                  onClick={submitAssessment}
                  disabled={!feeling.trim() || isSubmitting || success}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
              {error && (
                <Alert className="mt-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {success && sentiment && (
                <div className="mt-8 flex flex-col items-center gap-8">
                  <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                      <div>
                        <h2 className="text-2xl font-bold text-green-700 mb-1">
                          Assessment Completed!
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Your personalized results and recommendations are
                          below.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between mt-6">
                      {/* Score Gauge */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">
                          Sentiment Score
                        </div>
                        <div className="relative flex items-center justify-center">
                          <svg width="90" height="90">
                            <circle
                              cx="45"
                              cy="45"
                              r="40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="8"
                            />
                            <circle
                              cx="45"
                              cy="45"
                              r="40"
                              fill="none"
                              stroke="#4f46e5"
                              strokeWidth="8"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={
                                2 *
                                Math.PI *
                                40 *
                                (1 - (sentiment.score || 0) / 100)
                              }
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 1s" }}
                            />
                          </svg>
                          <span className="absolute text-xl font-bold text-primary">
                            {sentiment.score}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">/100</span>
                      </div>
                      {/* Risk Level */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">
                          Risk Level
                        </div>
                        <span
                          className={`px-4 py-1 rounded-full text-white font-semibold text-lg ${
                            sentiment.riskLevel === "high"
                              ? "bg-red-600"
                              : sentiment.riskLevel === "moderate"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        >
                          {sentiment?.riskLevel
                            ? sentiment.riskLevel.charAt(0).toUpperCase() +
                              sentiment.riskLevel.slice(1)
                            : "-"}
                        </span>
                      </div>
                      {/* Sentiment */}
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">
                          Sentiment
                        </div>
                        <span
                          className={`px-4 py-1 rounded-full font-semibold text-lg ${
                            sentiment.sentiment === "positive"
                              ? "bg-green-100 text-green-700"
                              : sentiment.sentiment === "negative"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {sentiment.sentiment?.charAt(0).toUpperCase() +
                            sentiment.sentiment?.slice(1) || "-"}
                        </span>
                      </div>
                    </div>
                    {/* Tags */}
                    {sentiment.predicted_tags &&
                      sentiment.predicted_tags.length > 0 && (
                        <div className="mt-6">
                          <div className="text-xs text-gray-500 mb-1">
                            Relevant Tags
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sentiment.predicted_tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {/* Resource summary analytics */}
                    {resources.length > 0 && (
                      <div className="mt-8">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-primary">
                            Recommended Resources
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({resources.length} found)
                          </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {resources.slice(0, 4).map((resource) => (
                            <div
                              key={resource.id}
                              className="rounded-lg border border-gray-200 bg-white shadow p-4 flex flex-col h-full transition hover:shadow-md hover:border-primary/60"
                            >
                              <div
                                className="font-semibold text-primary mb-1 truncate"
                                title={resource.title}
                              >
                                {resource.title}
                              </div>
                              {resource.description && (
                                <div className="text-gray-700 text-sm mb-2 line-clamp-3">
                                  {resource.description}
                                </div>
                              )}
                              <div className="mt-auto flex items-center justify-between">
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 underline transition"
                                  >
                                    View Resource
                                  </a>
                                )}
                                {resource.category && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                    {resource.category}
                                  </span>
                                )}
                              </div>
                              {resource.tags && resource.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {resource.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {resources.length > 4 && (
                          <div className="mt-2 text-center">
                            <span className="text-xs text-gray-500">
                              And {resources.length - 4} more resources
                              available...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Appointment link */}
                    {sentiment &&
                      sentiment.requires_mental_health_professional && (
                        <div className="mt-8 flex justify-center">
                          <a
                            href="/appointments/book"
                            className="inline-block px-6 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition shadow"
                          >
                            Schedule an Appointment with a Mental Health
                            Professional
                          </a>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TopNavLayout>
  );
}
