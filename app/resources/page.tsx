"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TopNavLayout } from "@/components/layout/top-nav-layout"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"
import type { User, Resource } from "@/lib/types"
import { Search, Heart, FileText, Video, Headphones, ExternalLink, Plus } from "lucide-react"
import Link from "next/link"

export default function ResourcesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/auth/login")
          return
        }
        setUser(currentUser)

        // Get resources
        const { data: resourceData, error } = await supabase
          .from("resources")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setResources(resourceData || [])
        setFilteredResources(resourceData || [])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    // Filter resources based on search query and active category
    let filtered = resources

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query) ||
          resource.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (resource) => resource.category === activeCategory || resource.tags?.includes(activeCategory),
      )
    }

    setFilteredResources(filtered)
  }, [searchQuery, activeCategory, resources])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 animate-pulse mx-auto mb-4 text-purple-600" />
          <p>Loading resources...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Extract unique categories from resources
  const categories = ["all", ...new Set(resources.map((r) => r.category).filter(Boolean))] as string[]

  const getResourceIcon = (type?: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "video":
        return <Video className="h-5 w-5 text-red-600" />
      case "audio":
        return <Headphones className="h-5 w-5 text-green-600" />
      case "external_link":
        return <ExternalLink className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <TopNavLayout user={user}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Health Resources</h1>
              <p className="text-gray-600">Access helpful resources for improving your mental wellbeing</p>
            </div>

            {user.role === "admin" && (
              <Link href="/resources/create">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </Link>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="mb-4 flex flex-wrap h-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Resources */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.resource_type)}
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </div>
                    {resource.is_featured && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  {resource.content && <p className="text-gray-600 text-sm line-clamp-3 mb-4">{resource.content}</p>}
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resource.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {resource.resource_type === "external_link" && resource.url ? (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Resource
                      </Button>
                    </a>
                  ) : (
                    <Link href={`/resources/${resource.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? `No resources match your search for "${searchQuery}"`
                : "No resources available in this category"}
            </p>
          </div>
        )}
      </div>
    </TopNavLayout>
  )
}
