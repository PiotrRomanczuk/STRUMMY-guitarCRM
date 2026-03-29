/**
 * Analytics Agent Specifications
 *
 * Agents focused on data analysis and insights generation
 * with guitar-learning trajectory and music school business intelligence.
 */

import type { AgentSpecification } from '../agent-registry';

export const progressInsightsAgent: AgentSpecification = {
  id: 'student-progress-insights',
  name: 'Student Progress Insights Analyzer',
  description: 'Analyzes student data to provide actionable insights and recommendations',
  version: '1.1.0',

  purpose:
    'Analyze student learning patterns, progress trends, and performance data to provide teachers and administrators with actionable insights for improving instruction and student outcomes.',

  targetUsers: ['admin', 'teacher'],

  useCases: [
    'Analyze student progress across different time periods',
    'Identify learning patterns and trends',
    'Provide recommendations for struggling students',
    'Highlight successful teaching approaches',
    'Generate insights for curriculum improvements',
  ],

  limitations: [
    'Analysis limited to available data in system',
    'Cannot replace human observation and intuition',
    'Insights are suggestions, not definitive assessments',
    'Requires sufficient data history for meaningful analysis',
  ],

  systemPrompt: `You are a guitar education data analyst who understands the specific learning trajectory of guitar students. You translate raw lesson and assignment data into actionable teaching insights.

GUITAR LEARNING TRAJECTORY:
- Beginner phase (0-6 months): open chords, basic strumming, first simple songs
- Barre chord barrier (~3-6 months): the most common dropout point — identify students stuck here
- Intermediate plateau (6-18 months): barre chords, pentatonic scale, fingerpicking introduction
- Fingerpicking transition: moving from strumming to finger-independence (another common stall point)
- Advanced development (18+ months): improvisation, music theory application, complex repertoire

KEY PROGRESS INDICATORS:
- Lesson attendance consistency (weekly > biweekly > irregular)
- Song completion rate (songs started vs. songs marked as mastered)
- Technique progression (new techniques attempted per month)
- Assignment completion and quality
- Time between lessons (gaps suggest disengagement)

COMMON PATTERNS TO IDENTIFY:
- "Plateau students": same songs/techniques for 3+ lessons — suggest new challenge or approach change
- "Sprinters": rapid progress students who may burn out — suggest depth over breadth
- "Returners": students who took a break — need re-engagement strategy
- "Genre-locked": only interested in one genre — suggest cross-pollination for growth

INSIGHT DELIVERY:
- Lead with data-backed observations
- Provide specific, actionable recommendations
- Compare to typical learning milestones
- Celebrate achievements and growth
- Frame challenges as opportunities

OUTPUT FORMAT:
Structure your analysis as Markdown with these sections:
## Key Observations
## Strengths & Achievements
## Areas for Growth
## Specific Recommendations
## Next Milestone`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.6,
  maxTokens: 800,

  requiredContext: ['currentUser'],
  optionalContext: [
    'studentData',
    'lessonHistory',
    'assignmentHistory',
    'studentLessons',
    'studentRepertoire',
    'studentAssignments',
  ],

  dataAccess: {
    tables: ['profiles', 'lessons', 'assignments', 'songs'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 1500,
    allowedFields: [
      'student_ids',
      'time_period',
      'analysis_focus',
      'lesson_data',
      'assignment_data',
      'progress_metrics',
    ],
    sensitiveDataHandling: 'sanitize',
  },

  enableLogging: true,
  enableAnalytics: true,
  successMetrics: ['insights_generated', 'recommendation_adoption', 'student_improvement'],

  uiConfig: {
    category: 'analysis',
    icon: 'TrendingUp',
    placement: ['dashboard', 'modal'],
    loadingMessage: 'Analyzing student progress data...',
    errorMessage: 'Could not generate progress insights. Please try again.',
  },
};

export const adminInsightsAgent: AgentSpecification = {
  id: 'admin-dashboard-insights',
  name: 'Admin Dashboard Business Intelligence',
  description: 'Provides business intelligence and operational insights for school administration',
  version: '1.1.0',

  purpose:
    'Analyze school-wide data to provide administrators with strategic insights, operational recommendations, and business intelligence for making informed decisions about school management and growth.',

  targetUsers: ['admin'],

  useCases: [
    'Generate monthly business performance insights',
    'Analyze enrollment trends and patterns',
    'Identify operational efficiency opportunities',
    'Provide strategic recommendations for growth',
    'Monitor teacher performance and workload distribution',
  ],

  limitations: [
    'Based on available system data only',
    'Cannot include external market factors',
    'Insights are analytical suggestions, not business advice',
    'Requires sufficient operational history for trends',
  ],

  systemPrompt: `You are a music school business analyst who understands the unique economics and operations of private guitar instruction. You provide strategic insights grounded in music education industry knowledge.

MUSIC SCHOOL BUSINESS INTELLIGENCE:
- Seasonal patterns: enrollment peaks in September (back-to-school) and January (New Year resolutions); dips in summer and December
- Retention benchmarks: healthy guitar schools retain 70-80% of students year-over-year
- Revenue per student: lesson fees, material sales, recital fees, summer camp upsells
- Teacher utilization: optimal is 25-30 lesson hours/week with prep time
- Student lifetime value: average guitar student stays 1.5-2 years

SCHEDULING OPTIMIZATION:
- After-school hours (3-7 PM) are premium slots — maximize utilization
- Weekend morning slots popular for adult students
- Group lesson economics: 3-4 students at reduced per-student rate can increase hourly revenue
- Cancellation patterns: track no-show rates by day/time to identify unreliable slots

KEY METRICS TO ANALYZE:
- Student churn rate by month (new enrollments vs. departures)
- Lesson utilization rate (booked hours / available hours)
- Revenue per available lesson hour
- Student-to-teacher ratio trends
- Popular instruments/genres (opportunity for new offerings)
- Average lessons per student per month (engagement metric)

INSIGHT DELIVERY:
- Lead with key findings and actionable recommendations
- Include relevant metrics and period-over-period comparisons
- Highlight both opportunities and risks
- Suggest concrete next steps with expected impact
- Use professional business analysis tone

OUTPUT FORMAT:
Structure your analysis as Markdown with these sections:
## Key Findings
## Metrics Summary
## Opportunities
## Risks & Concerns
## Recommended Actions`,

  model: 'meta-llama/llama-3.3-70b-instruct:free',
  temperature: 0.5,
  maxTokens: 900,

  requiredContext: ['currentUser'],
  optionalContext: ['schoolStats', 'enrollmentData', 'revenueData'],

  dataAccess: {
    tables: ['profiles', 'lessons', 'songs'],
    permissions: ['read'],
  },

  inputValidation: {
    maxLength: 1000,
    allowedFields: [
      'total_users',
      'total_students',
      'total_teachers',
      'total_lessons',
      'recent_users',
      'analysis_period',
    ],
    sensitiveDataHandling: 'sanitize',
  },

  enableLogging: true,
  enableAnalytics: true,
  successMetrics: ['insights_generated', 'recommendations_implemented', 'business_improvement'],

  uiConfig: {
    category: 'analysis',
    icon: 'BarChart3',
    placement: ['dashboard'],
    loadingMessage: 'Analyzing business performance data...',
    errorMessage: 'Could not generate business insights. Please try again.',
  },
};
