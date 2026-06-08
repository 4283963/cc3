export interface User {
  id: number
  username: string
  display_name: string
  email?: string
  avatar_url?: string
  department?: string
}

export interface WeightConfig {
  id: number
  name: string
  code_line_weight: number
  bug_fix_weight: number
  story_point_weight: number
  sonar_bug_penalty: number
  code_smell_penalty: number
  vulnerability_penalty: number
  updated_at: string
  updated_by?: string
}

export interface UserEfficiency {
  rank: number
  user_id: number
  username: string
  display_name: string
  avatar_url?: string
  department?: string
  total_lines: number
  bugs_fixed: number
  story_points: number
  sonar_bugs: number
  code_smells: number
  vulnerabilities: number
  total_score: number
  bug_rate: number
}

export interface EfficiencyRankingResponse {
  rankings: UserEfficiency[]
  weights: WeightConfig
  updated_at: string
}

export interface WeightConfigUpdate {
  code_line_weight?: number
  bug_fix_weight?: number
  story_point_weight?: number
  sonar_bug_penalty?: number
  code_smell_penalty?: number
  vulnerability_penalty?: number
}
