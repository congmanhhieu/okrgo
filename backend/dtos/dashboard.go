package dtos

type ObjectiveProgress struct {
	Red    int `json:"red"`    // 0-40%
	Yellow int `json:"yellow"` // 40-70%
	Green  int `json:"green"`  // 70-100%
}

type CheckInStatus struct {
	OnTime int `json:"on_time"`
	Late   int `json:"late"`
}

type ConfidenceStats struct {
	NotConfident      int `json:"not_confident"`
	LackingConfidence int `json:"lacking_confidence"`
	Confident         int `json:"confident"`
	VeryConfident     int `json:"very_confident"`
}

type ExecutionSpeedStats struct {
	VerySlow int `json:"very_slow"`
	Slow     int `json:"slow"`
	Fast     int `json:"fast"`
	VeryFast int `json:"very_fast"`
}

type CommunicationTrend struct {
	Label     string `json:"label"` // Day/Week
	Feedbacks int    `json:"feedbacks"`
	Kudos     int    `json:"kudos"`
}

type DashboardSummary struct {
	TotalObjectives int `json:"total_objectives"`
	TotalStaff      int `json:"total_staff"`
	TotalKudosGiven int `json:"total_kudos_given"`
	TotalTasks      int `json:"total_tasks"`
}

type DashboardResponse struct {
	Progress       ObjectiveProgress    `json:"progress"`
	CheckinStatus  CheckInStatus        `json:"checkin_status"`
	Confidence     ConfidenceStats      `json:"confidence"`
	ExecutionSpeed ExecutionSpeedStats  `json:"execution_speed"`
	Trends         []CommunicationTrend `json:"trends"`
	Summary        DashboardSummary     `json:"summary"`
}
