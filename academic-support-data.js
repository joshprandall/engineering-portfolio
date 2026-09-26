window.JR_ACADEMIC_SUPPORT = {
  version: "2026.09.26",
  sourceChecked: "2026-09-26",
  philosophy: {
    title: "Learn with people, not only pages.",
    summary: "A course-support layer for live help, study groups, tutoring, exam support, and campus learning resources. It is designed to sit beside lessons, practice, labs, and mastery rather than replace them."
  },
  model: [
    {id:"live-help", title:"Real-time tutoring", description:"Surface live or scheduled help for the learner's active course, with in-person and virtual options when available."},
    {id:"study-groups", title:"Study group mode", description:"Make it easy to form or use a shared study space even outside formal tutoring hours."},
    {id:"course-schedules", title:"Course-specific support", description:"Attach support schedules to an academic course record so a learner can see the right help without searching a separate site."},
    {id:"exam-support", title:"Exam and make-up support", description:"Keep proctoring, make-up, review-session, and exam-help information near the course timeline."},
    {id:"resource-network", title:"Support network", description:"Connect mathematics, science, writing, tutoring, advising, and other support centers to the relevant course and subject."},
    {id:"private-help", title:"Escalation path", description:"When institutional tutoring is not enough, expose vetted or institution-listed private-help options with clear caveats."}
  ],
  institutions: [{
    id:"oregon-state",
    name:"Oregon State University",
    resources:[{
      id:"osu-mslc",
      name:"Mathematics and Statistics Learning Center",
      location:"Kidder Hall 108, Corvallis campus",
      liveScheduleUrl:"https://math.oregonstate.edu/undergraduate/mathematics-statistics-learning-center",
      access:{
        inPerson:true,
        virtual:true,
        virtualPlatform:"Microsoft Teams / Zoom",
        login:"ONID credentials may be required for virtual access",
        studyGroups:true
      },
      term:{
        name:"Fall 2026",
        session:"September 28 - December 4",
        finalsWeekTutoring:false,
        inPerson:[
          {days:"Monday-Thursday", hours:"10:00 AM-7:00 PM"},
          {days:"Friday", hours:"10:00 AM-4:00 PM"}
        ],
        virtual:[
          {days:"Monday-Thursday", hours:"5:00 PM-8:00 PM"}
        ],
        examProctoring:[
          {days:"Monday-Thursday", hours:"10:00 AM-5:00 PM"},
          {days:"Friday", hours:"10:00 AM-4:00 PM"}
        ]
      },
      courses:{
        "MTH 231":{
          tutors:[
            {name:"Rebekah K.", schedule:[{day:"Thursday", hours:"4:00 PM-7:00 PM"}]},
            {name:"Sumi V.", schedule:[
              {day:"Monday", hours:"10:00 AM-11:00 AM"},
              {day:"Wednesday", hours:"10:00 AM-11:00 AM"},
              {day:"Friday", hours:"12:00 PM-1:00 PM"}
            ]}
          ]
        }
      },
      related:[
        {name:"Academic Success Center", location:"Waldo Hall 125", area:"general academic support"},
        {name:"Science Success Center", location:"Kidder Hall 109", area:"science support"},
        {name:"Vole Hole", location:"Weniger Hall 115", area:"biology"},
        {name:"Mole Hole", location:"Valley Library, 3rd floor", area:"chemistry"},
        {name:"Worm Hole", location:"Weniger Hall 334", area:"physics"}
      ],
      notes:[
        "Students can use the center as a math study-group space, including outside formal tutoring hours.",
        "Course-specific tutor schedules supplement the general tutoring hours.",
        "Make-up exam proctoring is available during published proctoring hours; learners should allow enough time to finish before closing.",
        "The department also maintains a private mathematics tutor list; the institution states that listed tutors are not screened."
      ]
    }]
  }]
};