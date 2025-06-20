"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TopNavLayout } from "@/components/layout/top-nav-layout";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import type { User, Assessment, Resource } from "@/lib/types";
import {
  Brain,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Play,
  FileText,
  Headphones,
} from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch recommended resources for assessments based on predicted conditions
  const fetchRecommendedResources = async (
    conditions: string[],
    riskLevel?: string
  ): Promise<Resource[]> => {
    try {
      let query = supabase
        .from("resources")
        .select("*")
        .eq("is_featured", true);

      // Add category filters based on predicted conditions
      if (conditions.length > 0) {
        const categoryFilters = conditions.map(
          (condition) => `category.ilike.%${condition}%`
        );
        const tagFilters = conditions.map(
          (condition) => `tags.cs.{${condition}}`
        );
        query = query.or([...categoryFilters, ...tagFilters].join(","));
      }

      // For high/critical risk, prioritize crisis resources
      if (riskLevel === "high" || riskLevel === "critical") {
        query = query.or(
          "category.ilike.%crisis%,category.ilike.%emergency%,tags.cs.{crisis},tags.cs.{emergency}"
        );
      }

      const { data: resources, error } = await query.limit(6);

      if (error) {
        console.error("Error fetching resources:", error);
        return [];
      }

      return resources || [];
    } catch (error) {
      console.error("Database error:", error);
      return [];
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "article":
        return <BookOpen className="h-4 w-4" />;
      case "video":
        return <Play className="h-4 w-4" />;
      case "audio":
        return <Headphones className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "external_link":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getResourceTypeColor = (resourceType: string) => {
    switch (resourceType) {
      case "article":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "video":
        return "bg-red-100 text-red-800 border-red-200";
      case "audio":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pdf":
        return "bg-green-100 text-green-800 border-green-200";
      case "external_link":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        if (currentUser.role !== "student") {
          router.push("/dashboard");
          return;
        }
        setUser(currentUser);

        // Get student ID
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", currentUser.id)
          .single();

        if (studentError || !student) {
          throw new Error(
            "Student profile not found. Please complete your profile setup."
          );
        }

        // Get assessments
        const { data: assessmentData, error: assessmentError } = await supabase
          .from("assessments")
          .select("*")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false });

        if (assessmentError) {
          throw new Error(
            `Failed to load assessments: ${assessmentError.message}`
          );
        }

        // Fetch recommended resources for each assessment
        const assessmentsWithResources = await Promise.all(
          (assessmentData || []).map(async (assessment) => {
            const predictedConditions = assessment.predicted_conditions || [];
            const riskLevel =
              assessment.predicted_risk_level || assessment.risk_level;
            const recommendedResources = await fetchRecommendedResources(
              predictedConditions,
              riskLevel
            );

            return {
              ...assessment,
              recommended_resources: recommendedResources,
            };
          })
        );

        setAssessments(assessmentsWithResources);
      } catch (error: any) {
        console.error("Error loading assessments:", error);
        setError(error.message || "Failed to load assessment data");
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p>Loading your assessment results...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskLevelIcon = (level?: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="h-4 w-4" />;
      case "moderate":
        return <AlertCircle className="h-4 w-4" />;
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  console.log("Assessments:", assessments);
  return (
    <TopNavLayout user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Results
          </h1>
          <p className="text-gray-600">
            View your mental health assessment history and detailed results.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              Error Loading Results
            </AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* No Assessments */}
        {!error && assessments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Assessments Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Take your first mental health assessment to get personalized
                insights.
              </p>
              <Link href="/assessment">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Take Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Assessment List */}
        {!error && assessments.length > 0 && (
          <div className="space-y-6">
            {assessments.map((assessment) => (
              <Card
                key={assessment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        Assessment Results
                      </CardTitle>
                      <CardDescription>
                        {new Date(assessment.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getRiskLevelColor(
                        assessment.predicted_risk_level || assessment.risk_level
                      )} flex items-center gap-1`}
                    >
                      {getRiskLevelIcon(
                        assessment.predicted_risk_level || assessment.risk_level
                      )}
                      {(
                        assessment.predicted_risk_level ||
                        assessment.risk_level ||
                        "Unknown"
                      )
                        .charAt(0)
                        .toUpperCase() +
                        (
                          assessment.predicted_risk_level ||
                          assessment.risk_level ||
                          "unknown"
                        ).slice(1)}{" "}
                      Risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">
                        Wellness Score
                      </div>
                      <div className="text-lg font-semibold text-purple-700">
                        {assessment.wellness_score !== undefined
                          ? `${assessment.wellness_score}/100`
                          : assessment.overall_wellbeing_score
                          ? `${assessment.overall_wellbeing_score}/100`
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                      <div className="text-lg font-semibold capitalize">
                        {assessment.sentiment_label
                          ? assessment.sentiment_label.replace("_", " ")
                          : assessment.predicted_sentiment
                          ? assessment.predicted_sentiment
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Conditions</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {assessment.predicted_conditions
                          ? assessment.predicted_conditions.length
                          : 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Resources</div>
                      <div className="text-lg font-semibold text-green-700">
                        {assessment.recommended_resources
                          ? assessment.recommended_resources.length
                          : 0}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Preview */}
                  {assessment.ai_analysis && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {assessment.ai_analysis.length > 150
                          ? `${assessment.ai_analysis.substring(0, 150)}...`
                          : assessment.ai_analysis}
                      </div>
                    </div>
                  )}

                  {/* Professional Help Alert */}
                  {assessment.professional_help_needed && (
                    <Alert className="mb-4 border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-700">
                        Professional support recommended based on this
                        assessment.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Crisis Alert */}
                  {assessment.crisis_indicators && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        This assessment indicated crisis-level concerns. Please
                        seek immediate support.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Predicted Conditions */}
                  {assessment.predicted_conditions &&
                    assessment.predicted_conditions.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Predicted Conditions:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {assessment.predicted_conditions.map(
                            (condition, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {condition
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Wellness Score */}
                  {assessment.wellness_score !== undefined && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            Wellness Score
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {assessment.wellness_score}/100
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {assessment.wellness_score >= 80
                            ? "Excellent"
                            : assessment.wellness_score >= 60
                            ? "Good"
                            : assessment.wellness_score >= 40
                            ? "Moderate"
                            : assessment.wellness_score >= 20
                            ? "Concerning"
                            : "Critical"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommended Resources */}
                  {assessment.recommended_resources &&
                    assessment.recommended_resources.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Recommended Resources (
                          {assessment.recommended_resources.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {assessment.recommended_resources
                            .slice(0, 4)
                            .map((resource) => (
                              <div
                                key={resource.id}
                                className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                                onClick={() =>
                                  resource.url &&
                                  window.open(resource.url, "_blank")
                                }
                              >
                                <div className="flex items-start gap-2">
                                  <div className="mt-1">
                                    {getResourceIcon(resource.resource_type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {resource.title}
                                      </h4>
                                      <Badge
                                        className={`${getResourceTypeColor(
                                          resource.resource_type
                                        )} text-xs`}
                                      >
                                        {resource.resource_type.replace(
                                          "_",
                                          " "
                                        )}
                                      </Badge>
                                    </div>
                                    {resource.description && (
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        {resource.description}
                                      </p>
                                    )}
                                    {resource.category && (
                                      <div className="mt-1">
                                        <span className="text-xs text-purple-600 font-medium">
                                          {resource.category
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                        {assessment.recommended_resources.length > 4 && (
                          <div className="mt-2 text-center">
                            <Link href={`/results/${assessment.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700"
                              >
                                View{" "}
                                {assessment.recommended_resources.length - 4}{" "}
                                more resources
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Resource Coverage Score */}
                  {assessment.resource_coverage_score !== undefined && (
                    <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-xs text-green-700">
                        <strong>Resource Coverage:</strong>{" "}
                        {assessment.resource_coverage_score}%
                        <span className="ml-1">
                          (
                          {assessment.resource_coverage_score >= 80
                            ? "Excellent"
                            : assessment.resource_coverage_score >= 60
                            ? "Good"
                            : assessment.resource_coverage_score >= 40
                            ? "Moderate"
                            : "Limited"}{" "}
                          support available)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        {assessment.recommendations
                          ? `${assessment.recommendations.length} recommendations`
                          : "No recommendations"}
                      </div>
                      {assessment.recommended_resources &&
                        assessment.recommended_resources.length > 0 && (
                          <div className="text-xs text-purple-600">
                            {assessment.recommended_resources.length} resource
                            {assessment.recommended_resources.length !== 1
                              ? "s"
                              : ""}{" "}
                            available
                          </div>
                        )}
                    </div>
                    <Link href={`/results/${assessment.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Take New Assessment Button */}
        {!error && assessments.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/assessment">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Take New Assessment
              </Button>
            </Link>
          </div>
        )}
      </div>
    </TopNavLayout>
  );
}
