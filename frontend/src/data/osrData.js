// Market 448 OSR Scoring Tool - CORRECTED Data Structure with Proper Scoring Logic

export const STORES = ['1563', '1660', '2297', '2950', '2951', '3523', '5162', '5686'];

export const STORE_FOUNDATIONS = {
  '1660': ['people'],
  '2297': ['fulfillment'],
  '3523': ['fulfillment'],
  '2951': ['people'],
  '5686': ['availability', 'fulfillment', 'checkout']
};

export const SECTIONS = {
  availability: {
    title: 'Availability',
    description: 'Product Availability & Inventory Management Assessment',
    icon: '📦'
  },
  checkout: {
    title: 'Checkout',
    description: 'Customer Checkout Experience & Process Check Evaluation',
    icon: '🛒'
  },
  fulfillment: {
    title: 'Fulfillment',
    description: 'Order Fulfillment & Delivery Performance Review',
    icon: '🚚'
  },
  people: {
    title: 'People',
    description: 'Associate Engagement & Development Evaluation',
    icon: '👥'
  },
  culture: {
    title: 'Culture & Change',
    description: 'Organizational Culture & Change Management Assessment',
    icon: '🌎'
  }
};

export const QUESTIONS = {
  availability: {
    processCheck: [
      {
        id: 'av_pc_1',
        question: 'Is salesfloor inventory accurately located?',
        procedures: [
          { type: 'instructional', text: 'With a store leader of choice, review feature and modular location exceptions.' },
          { type: 'actionable', text: 'Review feature location exceptions in Me@Walmart', followUp: 'How many nil-pick errors were found?' },
          { type: 'actionable', text: 'Locate and review any "Empty locations"', followUp: 'How many empty location errors were found?' },
          { type: 'actionable', text: 'Review all "Idle locations" to determine if features are current', followUp: 'How many idle location errors were found?' },
          { type: 'actionable', text: 'Review modular location exceptions in Me@Walmart', followUp: 'How many "No location" modular errors were found?' },
          { type: 'actionable', text: 'Scan action alley features not previously reviewed', followUp: 'How many inaccurate features were found?' }
        ],
        rating: {
          green: { points: 2, criteria: 'No exceptions were found during the tour.' },
          yellow: { points: 1, criteria: 'Up to 10 exceptions were found during the tour.' },
          red: { points: 0, criteria: 'More than 10 exceptions were found during the tour.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 10 }
      },
      {
        id: 'av_pc_2',
        question: 'Is VizPick Topstock work completed from start-to-finish?',
        procedures: [
          { type: 'instructional', text: 'Validate VizPick Topstock is being completed at the right time. Work VizPick Topstock with at least three associates: two in food and consumables, and one in GM.' },
          { type: 'actionable', text: 'Using the Base Operating Structure Dashboard, validate VizPick Topstock completion during targeted hours', followUp: 'What percentage of targeted hours were NOT completed?' },
          { type: 'actionable', text: 'Select aisles flagged "Not Worked" in Me@Walmart or those with excessive topstock', followUp: 'How many aisles were flagged as not worked?' },
          { type: 'actionable', text: 'Work VizPick Topstock with associates and verify their knowledge of topstock indicators', followUp: 'How many associates lacked proper knowledge?' },
          { type: 'actionable', text: 'Verify associates understand "Stocked All" vs "Topstock remaining"', followUp: 'How many associates did NOT understand the difference?' },
          { type: 'instructional', text: 'Inspect equipment being used and observe associate safe working behavior.' }
        ],
        rating: {
          green: { points: 2, criteria: 'VizPick Topstock is consistently completed during targeted hours with proper associate knowledge.' },
          yellow: { points: 1, criteria: 'VizPick Topstock is mostly completed with some knowledge gaps.' },
          red: { points: 0, criteria: 'VizPick Topstock is not consistently completed or associates lack proper knowledge.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'av_pc_3',
        question: 'Is VizPick Backroom work completed from start-to-finish?',
        procedures: [
          { type: 'instructional', text: 'Validate VizPick Backroom is being completed at the right time.' },
          { type: 'actionable', text: 'Review Base Operating Structure Dashboard for VizPick Backroom completion', followUp: 'How many locations have not been seen in the last 36 hours?' },
          { type: 'actionable', text: 'Work VizPick Backroom with associates and verify their knowledge', followUp: 'How many associates lacked proper VizPick knowledge?' },
          { type: 'actionable', text: 'Verify associates understand bin auditing and exception handling', followUp: 'How many associates improperly handled exceptions?' },
          { type: 'actionable', text: 'Check for proper equipment usage and safety compliance', followUp: 'How many safety violations were observed?' },
          { type: 'instructional', text: 'Ensure all VizPick Backroom work is completed consistently and within the targeted time.' }
        ],
        rating: {
          green: { points: 2, criteria: 'VizPick Backroom is consistently completed.' },
          yellow: { points: 1, criteria: 'VizPick Backroom is mostly completed within timeframe with minor issues.' },
          red: { points: 0, criteria: 'VizPick Backroom is not completed within 36 hours or associates lack knowledge.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 5 }
      },
      {
        id: 'av_pc_4',
        question: 'Is stocking work completed from start-to-finish?',
        procedures: [
          { type: 'instructional', text: 'Review stocking completion rates and associate performance.' },
          { type: 'actionable', text: 'Check Overstock completion percentage in reporting systems', followUp: 'What percentage of overstock was NOT completed?' },
          { type: 'actionable', text: 'Verify associates are following proper overstock procedures', followUp: 'How many associates failed to follow proper procedures?' },
          { type: 'actionable', text: 'Review any incomplete stocking tasks', followUp: 'How many incomplete tasks were identified?' },
          { type: 'instructional', text: 'Ensure stocking meets the 90% completion threshold for grocery and 70% for general merchandise.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Overstock completion meets or exceeds 90% total store.' },
          yellow: { points: 1, criteria: 'Overstock completion is between 70-90% total store.' },
          red: { points: 0, criteria: 'Overstock completion is below 70% total store' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      }
    ],
    foundations: [
      {
        id: 'av_fd_1',
        question: 'Are stocking teams staffed and scheduled to meet the needs of the customer?',
        procedures: [
          { type: 'instructional', text: 'Conduct a staffing and scheduling review of the Stocking Teams with the Stocking Coach or Team Lead.' },
          { type: 'instructional', text: 'Review the headcount guidance in the Workforce Planning Portal for the stocking workgroup, noting any headcount gaps, high LOA counts, and/or low average FT/PT hours.' },
          { type: 'instructional', text: 'Review scheduling, noting gaps between scheduling vs. demand hours, actual vs. demand hours, and excessive call-in rates.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Scheduling for the stocking team consistently meets workload demand.' },
          yellow: { points: 1, criteria: 'Scheduling for the stocking team inconsistently meets workload demand.' },
          red: { points: 0, criteria: 'Scheduling for the stocking team does not meet workload demand.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'av_fd_2',
        question: 'Are theft mitigation efforts having a positive impact on in-stock, while providing the least amount of friction?',
        procedures: [
          { type: 'instructional', text: 'With the Asset Protection Coach or Team Lead, walk areas with locking showcases and review performance of the category, along with historical Nil-Picks.' },
          { type: 'instructional', text: 'Use the Return on Protection Report on AP1 to review categories in locking showcases and understand sales and nil-pick percentages.' },
          { type: 'instructional', text: 'Review the Nil-Pick Report for the previous 30 days to look for items in locking showcases.' },
          { type: 'instructional', text: 'Confirm digital team associates who pick in areas with showcases have access to items in locking showcases.' },
          { type: 'instructional', text: 'Confirm areas with locking showcases have call boxes for quick assistance by customers and Spark shoppers.' },
          { type: 'instructional', text: 'Review CCTV of underperforming categories (if available) to understand call box response time during peak and off-peak times.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Categories with locking showcases are not causing friction with customers and digital shoppers.' },
          yellow: { points: 1, criteria: 'Some categories with locking showcases are causing inconsistent levels of friction with customers and digital shoppers.' },
          red: { points: 0, criteria: 'Categories with locking showcases are clearly causing friction with customers and digital shoppers.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'av_fd_3',
        question: 'Are bin and aisle locations only deleted when there is a change in fixture or layout?',
        procedures: [
          { type: 'instructional', text: 'With the Stocking 1 Coach, review the Deleted Locations Report.' },
          { type: 'instructional', text: 'Review any deleted locations within the last 30 days and understand if the physical location was changed or removed.' },
          { type: 'instructional', text: 'Speak to associates who have recently deleted locations and determine why it was deleted.' },
          { type: 'instructional', text: 'If locations are being deleted without good cause, work with store leadership to remedy the situation.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Only legitimate locations have been deleted within the last 30 days.' },
          yellow: { points: 1, criteria: 'Locations were deleted mistakenly, but the situation has been remedied.' },
          red: { points: 0, criteria: 'Locations are being deleted purposely without good cause.' }
        },
        scoringType: 'evaluation'
      }
    ]
  },
  checkout: {
    processCheck: [
      {
        id: 'co_pc_1',
        question: 'Is staffing, scheduling, and register opening meeting customer needs?',
        procedures: [
          { type: 'instructional', text: 'Review frontend staffing and scheduling with the Frontend Coach or Team Lead.' },
          { type: 'actionable', text: 'Check current staffing levels against customer traffic patterns', followUp: 'What percentage of demand is NOT being met by current staffing?' },
          { type: 'actionable', text: 'Review register opening times and patterns', followUp: 'How many registers were closed during peak times when needed?' },
          { type: 'actionable', text: 'Assess customer wait times at checkout', followUp: 'How many customers experienced excessive wait times?' },
          { type: 'actionable', text: 'Review scheduling adherence and call-in rates', followUp: 'What percentage of shifts had call-ins or no-shows?' },
          { type: 'instructional', text: 'Ensure adequate coverage for all customer service areas.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Staffing and scheduling consistently meet customer needs with minimal wait times.' },
          yellow: { points: 1, criteria: 'Staffing and scheduling mostly meet customer needs with occasional delays.' },
          red: { points: 0, criteria: 'Staffing and scheduling do not meet customer needs with frequent delays.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'co_pc_2',
        question: 'Are Walmart store standards maintained at the frontend?',
        procedures: [
          { type: 'instructional', text: 'Conduct a 4x4 tour of the frontend area with the Frontend Coach or Team Lead.' },
          { type: 'actionable', text: 'Check cleanliness and organization of checkout lanes', followUp: 'How many lanes had cleanliness issues?' },
          { type: 'actionable', text: 'Verify proper signage and pricing displays', followUp: 'How many signage errors were found?' },
          { type: 'actionable', text: 'Review merchandise presentation and organization', followUp: 'How many presentation issues were identified?' },
          { type: 'actionable', text: 'Check equipment functionality and maintenance', followUp: 'How many equipment issues were found?' },
          { type: 'actionable', text: 'Assess overall frontend appearance and standards compliance', followUp: 'How many standards violations were observed?' },
          { type: 'instructional', text: 'Ensure all frontend areas meet Walmart visual standards.' }
        ],
        rating: {
          green: { points: 2, criteria: 'All frontend standards are consistently maintained.' },
          yellow: { points: 1, criteria: 'Most frontend standards are maintained with minor issues.' },
          red: { points: 0, criteria: 'Frontend standards are not consistently maintained.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 5 }
      },
      {
        id: 'co_pc_3',
        question: 'Are checkout associates meeting Walmart\'s service and friendliness standards?',
        procedures: [
          { type: 'instructional', text: 'With the Frontend Coach or Team Lead, observe frontend customer interactions.' },
          { type: 'instructional', text: 'Observe Team Leads for approachability and welcoming behavior.' },
          { type: 'actionable', text: 'Assess if Team Leads are balancing lines and directing customers to open registers', followUp: 'How many Team Leads failed to demonstrate proper line management?' },
          { type: 'actionable', text: 'Check if Team Leads are assisting Checkout TAs as needed', followUp: 'How many instances of inadequate assistance were observed?' },
          { type: 'instructional', text: 'Observe checkout operations.' },
          { type: 'actionable', text: 'Verify Checkout TAs are approaching and welcoming customers', followUp: 'How many associates failed to demonstrate proper greeting behavior?' },
          { type: 'actionable', text: 'Ensure Checkout TAs are practicing "Greet, Help, Thank"', followUp: 'How many associates did NOT consistently follow this practice?' },
          { type: 'actionable', text: 'Check if Checkout TAs are "redlining" when no customers are in line', followUp: 'How many associates were NOT redlining appropriately?' },
          { type: 'instructional', text: 'Observe safety standards at checkouts.' },
          { type: 'actionable', text: 'Confirm Checkout Team is picking up debris as they go', followUp: 'How many associates failed to demonstrate clean-as-you-go practices?' },
          { type: 'actionable', text: 'Verify Checkout Team is practicing "clean as you go"', followUp: 'How many cleanliness violations were observed?' },
          { type: 'actionable', text: 'Ensure Checkout Team is maintaining general safety standards', followUp: 'How many safety violations were observed?' }
        ],
        rating: {
          green: { points: 2, criteria: 'There is a clear culture of service on the frontend. Associates consistently demonstrate Walmart\'s service expectations.' },
          yellow: { points: 1, criteria: 'There are inconsistencies in demonstrating Walmart\'s service expectations.' },
          red: { points: 0, criteria: 'There is no clear culture of service on the frontend.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'co_pc_4',
        question: 'Are self-checkout associates providing quick, friendly, and efficient service at interventions?',
        procedures: [
          { type: 'instructional', text: 'Observe associate behavior during self-checkout interventions with the Frontend Coach or Team Lead and review key metrics together.' },
          { type: 'actionable', text: 'Verify Checkout TAs stationed at Self-Checkouts are actively greeting customers and offering assistance', followUp: 'How many associates failed to demonstrate active customer engagement?' },
          { type: 'actionable', text: 'Ensure Checkout TAs at Self-Checkouts are using a connected device logged into the Checkout app, actively monitoring and responding to alerts', followUp: 'How many associates were NOT properly using connected devices?' },
          { type: 'actionable', text: 'Assess if Checkout TAs at Self-Checkouts are being friendly and welcoming', followUp: 'How many associates demonstrated poor friendliness?' },
          { type: 'actionable', text: 'Check that Checkout TAs at Self-Checkouts greet customers before intervening', followUp: 'How many interventions lacked proper greetings?' },
          { type: 'instructional', text: 'Review the Frontend Health Dashboard Engage Report to determine if associates are using UpFront/Me@Checkout to respond to self-checkout interventions quickly.' },
          { type: 'actionable', text: 'Confirm the store is engaging and responding to self-checkout alerts, including Spark and Scan & Go audits', followUp: 'How many alerts had slow or no response?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Checkout associates are friendly, helpful, and respond quickly; they protect assets thoroughly without causing customer friction.' },
          yellow: { points: 1, criteria: 'Checkout associates are inconsistently friendly, helpful, and responsive; they inconsistently protect assets thoroughly without causing customer friction.' },
          red: { points: 0, criteria: 'Checkout associates are not friendly, helpful, or responsive; they do not protect assets thoroughly and create customer friction.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'co_pc_5',
        question: 'Are frontend service areas positioned to meet the needs of the customer?',
        procedures: [
          { type: 'instructional', text: 'Conduct a 4x4 tour of Customer Service (and Money Center, if applicable) with the Frontend Coach or Team Lead.' },
          { type: 'actionable', text: 'Check that Customer Service and Money Services are clean, neat, organized, and set to company standard', followUp: 'How many areas failed to meet company standards?' },
          { type: 'actionable', text: 'Verify associates have necessary space to sort and stage returns', followUp: 'How many workspace inadequacies were identified?' },
          { type: 'actionable', text: 'Validate that the money services binder and anti-fraud literature are available and compliant', followUp: 'How many required materials were missing or non-current?' },
          { type: 'actionable', text: 'Verify safety and compliance standards are being met', followUp: 'How many safety or compliance issues were identified?' },
          { type: 'instructional', text: 'Observe service team associate interactions with customers.' },
          { type: 'actionable', text: 'Ensure Checkout Service Team is friendly, welcoming, and demonstrates a problem-solving attitude', followUp: 'How many associates failed to demonstrate excellent customer service?' },
          { type: 'actionable', text: 'Assess if the store is adequately staffed for Checkout Services', followUp: 'What percentage of customer demand is NOT being met due to understaffing?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Service areas meet standards, associates meet service expectations, and areas are consistently staffed to customer demand.' },
          yellow: { points: 1, criteria: 'Some standards are not met, associates inconsistently meet service expectations, or areas are inconsistently staffed to customer demand.' },
          red: { points: 0, criteria: 'Service areas need resetting, associates do not meet service expectations, and/or staffing is not aligned to customer demand.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      }
    ],
    foundations: [
      {
        id: 'co_fd_1',
        question: 'Are checkout associates trained effectively?',
        procedures: [
          { type: 'instructional', text: 'While touring with the Frontend Coach or Team Lead, observe and interview associates on their training and onboarding experience.' },
          { type: 'instructional', text: 'Review frontend associate training records, and determine if associates are allowed to complete training on time.' },
          { type: 'instructional', text: 'Observe how associates interact with customers and their tools to determine if they are demonstrating proficiency in their roles.' },
          { type: 'instructional', text: 'Interview newer associates and determine if their training experience meets Walmart\'s expectations.' }
        ],
        rating: {
          green: { points: 2, criteria: 'There is a clear training culture on the frontend, with associates consistently speaking to a supportive and informative training and onboarding experience.' },
          yellow: { points: 1, criteria: 'There are inconsistencies in how associates are trained and onboarded.' },
          red: { points: 0, criteria: 'There is no clear training culture on the frontend, with associates not able to speak to a supportive training and onboarding experience.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'co_fd_2',
        question: 'Are frontend leaders following daily routines?',
        procedures: [
          { type: 'instructional', text: 'With the Frontend Coach or Team Lead, conduct a tour to determine if daily routines are followed.' },
          { type: 'instructional', text: 'Using the New Operating Model guidance for Checkout and Services, tour and interview frontend team leads to determine if they are following their daily routines to setup the store for success.' },
          { type: 'instructional', text: 'Review reporting and compare to daily activities: Use AP1 Cash Recycler Reporting to monitor activity on till check in, check out, and cash advances.' },
          { type: 'instructional', text: 'Use AP1 Register Audit Reporting to monitor completion of register audits.' },
          { type: 'instructional', text: 'Use AP1 Return Audit Reporting to monitor completion of return audits.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Routines are consistently executed by all team leads.' },
          yellow: { points: 1, criteria: 'Routines are inconsistently executed by all team leads, but all are knowledgeable about the work to be done and when.' },
          red: { points: 0, criteria: 'Routines are not executed, and/or team leads are not aware of their routines.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'co_fd_3',
        question: 'Are leaders prepared to maintain a fast checkout experience during unexpected peak traffic times?',
        procedures: [
          { type: 'instructional', text: 'With the Frontend Coach or Team Lead, review contingency plans for peak traffic times when supplemental staff may be needed on the frontend.' },
          { type: 'instructional', text: 'Understand how leadership responds to excessive frontend traffic, while still maintaining service expectations.' },
          { type: 'instructional', text: 'Determine if the store has sufficient backup staffing who can be called to the frontend to assist with checkout and/or services.' },
          { type: 'instructional', text: 'Are Frontend Team Leads empowered to call associates from the salesfloor?' },
          { type: 'instructional', text: 'Is leadership maintaining a presence on the frontend during unexpected traffic?' }
        ],
        rating: {
          green: { points: 2, criteria: 'There are sufficient plans and backup staffing to maintain a fast and friendly checkout experience. All leaders are aware of plans and provide needed assistance.' },
          yellow: { points: 1, criteria: 'There is inconsistent knowledge of plans and available backup staffing.' },
          red: { points: 0, criteria: 'There is no plan, or not sufficient backup staffing and/or support.' }
        },
        scoringType: 'evaluation'
      }
    ]
  },
  fulfillment: {
    processCheck: [
      {
        id: 'fu_pc_1',
        question: 'Is the OPD team staffed and scheduled to meet customer demand?',
        procedures: [
          { type: 'instructional', text: 'Review OPD staffing and scheduling with the Digital Coach or Team Lead.' },
          { type: 'actionable', text: 'Check current OPD staffing levels against order volume', followUp: 'What percentage of order demand is NOT being met by current staffing?' },
          { type: 'actionable', text: 'Review picker productivity and completion rates', followUp: 'How many pickers are below productivity standards?' },
          { type: 'actionable', text: 'Assess order fulfillment times and customer wait times', followUp: 'How many orders exceeded target fulfillment times?' },
          { type: 'actionable', text: 'Review scheduling adherence and coverage gaps', followUp: 'How many coverage gaps were identified?' },
          { type: 'instructional', text: 'Ensure adequate coverage for all OPD service areas and time slots.' }
        ],
        rating: {
          green: { points: 2, criteria: 'OPD staffing and scheduling consistently meet customer demand with optimal fulfillment times.' },
          yellow: { points: 1, criteria: 'OPD staffing and scheduling mostly meet customer demand with minor delays.' },
          red: { points: 0, criteria: 'OPD staffing and scheduling do not meet customer demand with frequent delays.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'fu_pc_2',
        question: 'Is the store fit to pick?',
        procedures: [
          { type: 'instructional', text: 'Conduct a 4x4 tour of food and consumables with the Digital and Food & Consumables coaches or team leads.' },
          { type: 'actionable', text: 'Walk Salesfloor using the Same Day Nil Pick Dashboard or Me@ Live Nils', followUp: 'How many nil-pick locations were identified?' },
          { type: 'actionable', text: 'Pull up Mappit and review accuracy of Pick Path. Create a SET ticket if aisle locations are missing.', followUp: 'How many missing aisle locations were found?' },
          { type: 'instructional', text: 'Utilize Feature Picking Accuracy Report' },
          { type: 'actionable', text: 'Verify the unknown and missing aisle location reports in GIF are being worked.', followUp: 'How many unknown locations need to be resolved?' },
          { type: 'actionable', text: 'Review a sampling of categories from OTC, dry grocery, dairy, frozen, meat, deli, bakery and produce for out of dates.', followUp: 'How many out-of-date items were found?' },
          { type: 'actionable', text: 'Tour fresh areas for item quality, production, and out of dates', followUp: 'How many quality issues were identified in fresh areas?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The store is fit to pick in all areas. All features are located and being picked from (if called for), no modulars are missing locations, and out of dates are extremely limited. Pick Paths are accurate.' },
          yellow: { points: 1, criteria: 'A few areas (1-2 departments) are unsuitable for picking. Some features were not found, a few modulars lack assigned locations, or some out-of-date items were identified in the reviewed categories.' },
          red: { points: 0, criteria: 'Food and consumables are not fit to pick. Numerous features were unassigned or modulars not located. Many out of dates were found in the categories reviewed.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 10 }
      },
      {
        id: 'fu_pc_3',
        question: 'Are all OPD backroom procedures followed?',
        procedures: [
          { type: 'instructional', text: 'Conduct a 4x4 tour of the OPD backroom with the Digital Coach or Team Lead.' },
          { type: 'actionable', text: 'Observe shoppers picking and dropping off carts, and BRC associates staging, prepping, and dispensing.', followUp: 'How many procedure violations were observed?' },
          { type: 'actionable', text: 'Verify separation of Delivery, Pickup, and InHome orders during staging.', followUp: 'How many orders were improperly separated?' },
          { type: 'actionable', text: 'Review GIF tiles for any opportunities present within MyStore (Picking, Exceptions, Needs Attention), Staging, Receiving or Quality Checks.', followUp: 'How many opportunities require immediate attention?' },
          { type: 'actionable', text: 'Ensure trip labels are used for GMD trips.', followUp: 'How many GMD trips lacked proper labels?' },
          { type: 'actionable', text: 'Randomly verify totes have accurate staging locations.', followUp: 'How many totes had incorrect staging locations?' },
          { type: 'actionable', text: 'Verify totes have only one label and the consolidation process is followed.', followUp: 'How many labeling errors were found?' },
          { type: 'actionable', text: 'Observe quality checks being performed.', followUp: 'How many quality check deficiencies were observed?' },
          { type: 'actionable', text: 'Randomly verify Delivery & GMD orders are in a valid status and cancelled orders are removed timely.', followUp: 'How many orders had invalid status?' },
          { type: 'actionable', text: 'Observe role clarity and verify it matches the taskboard.', followUp: 'How many associates were unclear about their roles?' },
          { type: 'actionable', text: 'Validate all equipment and fixtures are safe and in good condition.', followUp: 'How many safety or equipment issues were identified?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The backroom area is in excellent condition, and associates follow all procedures to ensure accurate orders and organized staging.' },
          yellow: { points: 1, criteria: 'The backroom area is in good condition, and associates follow most procedures to keep orders accurate and organized.' },
          red: { points: 0, criteria: 'The backroom area is in poor condition, and keeping orders organized is not a priority.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 10 }
      },
      {
        id: 'fu_pc_4',
        question: 'Do associates follow all dispense procedures?',
        procedures: [
          { type: 'instructional', text: 'With the Digital Coach or Team Lead, observe dispense procedures and monitor the GIF Dispense tile from your device.' },
          { type: 'actionable', text: 'Make sure associates are following dispense safety and security procedures: wearing yellow safety vests, using dolly handles to pull carts, using individual key cards to enter and exit, checking IDs for age verification items, not placing totes on the ground.', followUp: 'How many safety procedure violations were observed?' },
          { type: 'actionable', text: 'Associates should be making friendly contact with customers and drivers, and covering W+ talking points provided in the GIF Dispense screen with customers.', followUp: 'How many associates failed to demonstrate proper customer engagement?' },
          { type: 'actionable', text: 'Make sure drivers are not taking totes/labels with them, loading their own car, or removing labels from totes.', followUp: 'How many driver procedure violations were observed?' },
          { type: 'actionable', text: 'Verify the OPD door is only being used for dispensing traffic (associates are using main entrances for entry/exit into the store for work/breaks, no loitering).', followUp: 'How many improper door usage instances were observed?' },
          { type: 'actionable', text: 'Make sure associates are verbally asking for PIN codes from drivers.', followUp: 'How many PIN verification failures were observed?' }
        ],
        rating: {
          green: { points: 2, criteria: 'All procedures are followed per guidelines, associates are being safe in the parking lot, with a high level of carside engagement, and all controls followed consistently.' },
          yellow: { points: 1, criteria: 'Associates are safe in the parking lot, but other dispense procedures are inconsistently followed by associates, or there is a specific process that isn\'t followed.' },
          red: { points: 0, criteria: 'Associates are not safe in the parking lot. Multiple processes are not executed.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 5 }
      }
    ],
    foundations: [
      {
        id: 'fu_fd_1',
        question: 'Are OPD associates trained to perform their job functions?',
        procedures: [
          { type: 'instructional', text: 'With the Digital Coach, review training and onboarding plans for the digital teams.' },
          { type: 'instructional', text: 'Are training plans in place for new associates?' },
          { type: 'instructional', text: 'Are Onboarding Knowledge Checklists being used to monitor progress?' },
          { type: 'instructional', text: 'Is there a follow up plan with new hires to ensure training is completed?' },
          { type: 'instructional', text: 'Look at digital learning tools with the people lead and assess the timely completion of ULearn modules, Academy training, and badging.' },
          { type: 'instructional', text: 'Are sponsors in place for the digital space?' },
          { type: 'instructional', text: 'Are team huddles happening in the OPD space to update associates on performance and changes?' },
          { type: 'instructional', text: 'Speak to associates to understand their training and onboarding experience to determine if it aligns with the store\'s plans and company expectations.' }
        ],
        rating: {
          green: { points: 2, criteria: 'Associate onboarding timelines are updated. New associates are assigned sponsors and have consistent training plans. Associates are up to date on process updates.' },
          yellow: { points: 1, criteria: 'Associate onboarding experiences are inconsistent. Process updates are inconsistently communicated to associates.' },
          red: { points: 0, criteria: 'Associates are not effectively trained as they are onboarded onto the OPD team.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'fu_fd_2',
        question: 'Is the OPD backroom setup to be a productive environment?',
        procedures: [
          { type: 'instructional', text: 'Conduct a 4x4 tour of the OPD backroom area(s) with the Digital Coach or Digital Team Lead.' },
          { type: 'instructional', text: 'Verify both the Customer Experience Board and ATC Backroom Crew Board are filled out with current info, including Lunch times and both breaks.' },
          { type: 'instructional', text: 'Walk Backroom Layout and compare to Map from Roc Viewer. Utilize: GMD Capacity Look-Up Tool – Updated quarterly and shows store\'s capacity.' },
          { type: 'instructional', text: 'GMD Staging Tool – Shows recommended steel sections needed for staging.' },
          { type: 'instructional', text: 'Does the store have a well-maintained Digital Supply Modular/Returns section?' },
          { type: 'instructional', text: 'Review Online Pickup & Delivery Area Standards for correct format setup, under Backroom Setup – Returns & Supplies Small/Large Format.' },
          { type: 'instructional', text: 'Verify totes are setup for all return types including items processed through Return with Me.' },
          { type: 'instructional', text: 'Tour Coolers/Freezers to ensure orders are staged per process.' },
          { type: 'instructional', text: 'Review any rescheduled orders from previous day – is there an action plan?' },
          { type: 'instructional', text: 'Ensure all OPD doors are operational and verify work orders, if needed.' }
        ],
        rating: {
          green: { points: 2, criteria: 'The backroom is setup for capacity and success. Areas are set to standard and associates are following processes to keep the backroom organized. Associates are working safely.' },
          yellow: { points: 1, criteria: 'The backroom is mostly setup for success. A limited number of areas are not set to standard, or associates are not following a small number of processes to keep the backroom organized. Associates are working safely.' },
          red: { points: 0, criteria: 'The backroom is not setup for capacity and success. Associates are not working safely.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'fu_fd_3',
        question: 'Is the parking lot setup to provide a seamless customer experience?',
        procedures: [
          { type: 'instructional', text: 'With the Digital Coach or Team Lead, conduct a 4x4 tour of the OPD areas of the parking lot.' },
          { type: 'instructional', text: 'Walk the parking lot, from all customer drive entrances, and verify that pickup and delivery signage is correct and easy to follow.' },
          { type: 'instructional', text: 'Verify geofencing parameters in GSCOPE to make sure customers can access pickup options when they enter the parking lot.' },
          { type: 'instructional', text: 'Verify all permanent and temporary bay numbers are entered under "Calibrate" in WISMO.' },
          { type: 'instructional', text: 'Make sure to check all pickup bays, including liquor box.' },
          { type: 'instructional', text: 'Call the OPD cell phone number: Someone should be assigned to monitor. Check the voice message to make sure it is updated.' }
        ],
        rating: {
          green: { points: 2, criteria: 'All items are accurate (parking lot signage, geofence, bay numbers, and the cell phone is monitored, and the voice message is updated).' },
          yellow: { points: 1, criteria: 'One of the parking lot elements is not accurate/updated.' },
          red: { points: 0, criteria: 'More than one of the parking lot elements are not accurate or updated.' }
        },
        scoringType: 'evaluation'
      }
    ]
  },
  people: {
    processCheck: [
      {
        id: 'pe_pc_1',
        question: 'Are associate work and break areas providing a positive work experience?',
        procedures: [
          { type: 'instructional', text: 'Conduct a 4x4 tour of associate work and break areas with the people lead or a manager.' },
          { type: 'actionable', text: 'Tour breakrooms, restrooms (public and associate-only), offices, nursing mother rooms, workstations, and the associate resource center.', followUp: 'How many areas need improvement?' },
          { type: 'actionable', text: 'Review the Associate Spaces process guide for standards.', followUp: 'How many standards violations were identified?' },
          { type: 'actionable', text: 'Use Coaching by Walking Around (CBWA) to talk to associates (who are clocked in) about the normal conditions of these spaces.', followUp: 'How many associates reported negative experiences?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The areas are in excellent condition, indicating that maintaining these spaces is a leadership priority. Associates have confirmed that the areas are consistently well-maintained. Minor suggestions for improvement may be provided.' },
          yellow: { points: 1, criteria: 'Conditions vary across areas, with some in excellent shape and others needing improvement. Most areas have basic notes. Associates report that while conditions are generally good, some work is required.' },
          red: { points: 0, criteria: 'Areas are not a priority for leadership, with major or numerous basic notes needed for improvement.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 5 }
      },
      {
        id: 'pe_pc_2',
        question: 'Are hiring and onboarding practices setting the facility up for future success?',
        procedures: [
          { type: 'instructional', text: 'Conduct a review of the facility\'s hiring and onboarding processes with the people lead or a manager.' },
          { type: 'actionable', text: 'Understand the typical hiring process and timeline.', followUp: 'How many days beyond target does hiring typically take?' },
          { type: 'actionable', text: 'Review current open requisitions and the screening process. If candidate pools are lacking, discuss recruitment and advertising strategies.', followUp: 'How many open requisitions have been unfilled for over 30 days?' },
          { type: 'actionable', text: 'Use Coach by Walking Around (CBWA) to talk to recent hires about their onboarding experience (refer to the Onboarding Facilitator Guide for discussion points).', followUp: 'How many recent hires reported negative onboarding experiences?' },
          { type: 'actionable', text: 'Review 90-day, 180-day, and annual turnover metrics with the people lead to identify opportunities and address any goal misses.', followUp: 'How many percentage points is the 90-day turnover above target?' },
          { type: 'actionable', text: 'Review quality of hire reporting.', followUp: 'How many percentage points is the quality of hire score below target?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The people lead is proactive in recruiting and hiring according to store staffing needs. Onboarding is educational and engaging, with new associates expressing positive feedback.' },
          yellow: { points: 1, criteria: 'There are inconsistencies in the hiring process (e.g., feeling rushed or reactive) or onboarding experiences vary among associates.' },
          red: { points: 0, criteria: 'Recruiting and hiring are not prioritized by the people lead or management, or the onboarding process requires significant improvement.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'pe_pc_3',
        question: 'Are associates engaged, supported by their leadership team, and do they have a sense of belonging at Walmart?',
        procedures: [
          { type: 'instructional', text: 'Conduct a review of the engagement efforts by the leadership team with the people lead or a manager.' },
          { type: 'actionable', text: 'Review Associate Engagement Survey and AES Pulse results, including top wins and issues.', followUp: 'How many percentage points is the engagement score below target?' },
          { type: 'actionable', text: 'Understand the types of associate meetings or listening sessions taking place and how leaders respond to feedback.', followUp: 'How many quarters have passed without listening sessions?' },
          { type: 'actionable', text: 'Check for documented actions resulting from associate feedback.', followUp: 'How many feedback items lack documented follow-up actions?' },
          { type: 'actionable', text: 'Assess associates\' awareness of Associate Resource Groups (ARGs), community events, and other available resources.', followUp: 'What percentage of associates are unaware of available resources?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Leadership prioritizes listening to associates. Most associates can discuss how management listens and reacts to their concerns. Associates are aware of leadership support and available resources.' },
          yellow: { points: 1, criteria: 'Inconsistencies exist in engagement programs or associate awareness of feedback and belonging programs. Associates feel supported, but there is no formal structure or documentation for associate listening.' },
          red: { points: 0, criteria: 'Leadership does not prioritize associate feedback or support a culture of belonging or associates do not feel their feedback matters.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 30 }
      },
      {
        id: 'pe_pc_4',
        question: 'Is there a culture of accountability in the store regarding recognition and performance?',
        procedures: [
          { type: 'instructional', text: 'Conduct a review of recognition and accountability processes with the people lead or manager.' },
          { type: 'actionable', text: 'Check if the store has a formal recognition program.', followUp: 'How many months have passed without formal recognition events?' },
          { type: 'actionable', text: 'Ensure associates are consistently recognized for birthdays, work anniversaries, promotions, and individual performance.', followUp: 'How many recognition opportunities were missed in the last month?' },
          { type: 'actionable', text: 'Review disciplinary actions over the last 90 days to determine if policies are applied fairly and consistently.', followUp: 'How many disciplinary actions appear inconsistent or unfair?' },
          { type: 'actionable', text: 'Use Coach by Walking Around (CBWA) to talk to associates about recognition opportunities and examples within the facility.', followUp: 'How many associates reported feeling unrecognized?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The store has a formal recognition program, associates and their work are celebrated. Disciplinary actions are applied consistently and fairly.' },
          yellow: { points: 1, criteria: 'The store recognizes associates but is inconsistent in its application. Disciplinary actions are applied fairly and consistently.' },
          red: { points: 0, criteria: 'There is no culture of accountability, associates are not consistently recognized, or disciplinary actions are not applied fairly and consistently.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 5 }
      },
      {
        id: 'pe_pc_5',
        question: 'Are associates trained to perform their jobs well and being trained to take future roles in the store?',
        procedures: [
          { type: 'instructional', text: 'Conduct a review of the training and future growth of associates with the people lead or manager.' },
          { type: 'actionable', text: 'Assess the timely completion of uLearn modules, Academy training, badging, and specialty licensing using digital learning tools.', followUp: 'What percentage of training is overdue?' },
          { type: 'actionable', text: 'Additionally, conduct a review of compliance, safety, and associate security (Avoid-Deny-Defend) training modules.', followUp: 'What percentage of safety training is overdue?' },
          { type: 'actionable', text: 'Understand how the leadership team is upskilling associates outside of structured training programs.', followUp: 'How many associates lack access to upskilling opportunities?' },
          { type: 'actionable', text: 'Evaluate LiveBetter U participation and associates\' knowledge of the LiveBetter U benefit.', followUp: 'What percentage of associates are unaware of LiveBetter U?' },
          { type: 'actionable', text: 'Use Coach by Walking Around (CBWA) to understand efforts in associate learning and development.', followUp: 'How many associates reported inadequate learning opportunities?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Associate training is current across all areas, including specialty licensing. The store actively invests in associate upskilling beyond structured training. Associates are knowledgeable about LiveBetter U.' },
          yellow: { points: 1, criteria: 'Associate training is somewhat current (at least 75%), and the store inconsistently invests in associate upskilling.' },
          red: { points: 0, criteria: 'Associate training is not a priority for leadership. Training is not current (below 75%), and there is no investment in upskilling.' }
        },
        scoringType: 'performance',
        thresholds: { green: 25, yellow: 50 }
      }
    ],
    foundations: [
      {
        id: 'pe_fd_1',
        question: 'Are store leadership positions filled urgently and competitively?',
        procedures: [
          { type: 'instructional', text: 'Assess store culture alignment with Walmart values through observation and interviews.' },
          { type: 'actionable', text: 'Review the last five coach or team lead positions that were hired for the facility with the people lead or store manager.', followUp: 'What was the average time to fill these positions?' },
          { type: 'actionable', text: 'Understand how long the positions were vacant', followUp: 'What was the longest vacancy period?' },
          { type: 'actionable', text: 'Understand how open leadership positions are communicated to the store team.', followUp: 'How are promotional opportunities communicated?' },
          { type: 'actionable', text: 'Understand how candidates are selected, and interviews are conducted.', followUp: 'How many panel members typically conduct interviews?' },
          { type: 'actionable', text: 'Evaluate recognition and appreciation practices', followUp: 'How frequently is recognition given to associates?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Efforts are made to fill positions promptly, and vacancies are not prolonged. Promotional opportunities are communicated to the entire store team. Candidates and interviews are evaluated by a panel of leaders to reach a hiring decision.' },
          yellow: { points: 1, criteria: 'Timelines for filling vacancies vary, but efforts are made to fill them quickly. Promotional opportunities are communicated openly, and a hiring decision.' },
          red: { points: 0, criteria: 'Positions remain open for an extended period (typically 60 - 90 days). Information about promotional opportunities is not always consistently communicated. Panels are not or interview candidates.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'pe_fd_2',
        question: 'Are the attendance and punctuality and time off policies consistently applied?',
        procedures: [
          { type: 'instructional', text: 'With the people lead or another manager, review data in Global Time and Attendance to determine how consistently policies are applied' },
          { type: 'actionable', text: 'Review the Total Active Occurrences report to understand how many associates exceed policy limits.', followUp: 'How many associates currently exceed policy limits?' },
          { type: 'actionable', text: 'Review the Attendance Exceptions Authorized Report and the active attendance exceptions to-be-worked screen to understand how often exceptions are reviewed/approved.', followUp: 'How many attendance exceptions are pending review?' },
          { type: 'actionable', text: 'Review time off requests for the facility to understand if requests are being actioned within 72 hours.', followUp: 'What percentage of time off requests are actioned within 72 hours?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The attendance policy rarely allows exceptions. Exceptions are addressed within 14 days, and time off requests are actioned within 72 hours.' },
          yellow: { points: 1, criteria: 'Some inconsistencies in the attendance policy cannot be explained. Attendance exceptions are typically addressed promptly, and time off requests are reviewed within 72 hours' },
          red: { points: 0, criteria: 'The application of the attendance policy is unclear. Attendance exceptions accumulate and are assigned reasons automatically by the system. Time off requests may not always be reviewed within 72 hours.' }
        },
        scoringType: 'evaluation'
      },
      {
        id: 'pe_fd_3',
        question: 'Are regular store meetings and tours conducted by leadership?',
        procedures: [
          { type: 'instructional', text: 'Speak to associates, review available meeting notes and documentation to understand how well store communication meetings and tours are conducted by leadership.' },
          { type: 'actionable', text: 'Understand how often store communication meetings are held on all three shifts and the content.', followUp: 'How many store meetings are held per week?' },
          { type: 'actionable', text: 'Understand how often the store manager and other leaders lead the weekly people meeting and the safety and security team meetings.', followUp: 'How many leadership meetings are conducted monthly?' },
          { type: 'actionable', text: 'Review touring schedules and notes to understand how often the store manager and coaches are conducting 4x4 tours with team leads and team associates.', followUp: 'How many 4x4 tours are conducted weekly?' },
          { type: 'actionable', text: 'Understand how often the store leadership team meets to plan the business.', followUp: 'How many business planning meetings occur monthly?' }
        ],
        rating: {
          green: { points: 2, criteria: 'The store manager and other store leaders meet regularly to discuss business matters. Meetings are held consistently across all three shifts, and leadership is involved in planning and execution meetings.' },
          yellow: { points: 1, criteria: 'The store manager and leadership team could benefit from meeting more regularly, improving communication with associates, and enhancing business planning efforts.' },
          red: { points: 0, criteria: 'There is a lack of evidence of regular store meetings and representation at other relevant meetings.' }
        },
        scoringType: 'evaluation'
      }
    ]
  },
  culture: {
    processCheck: [
      {
        id: 'cu_pc_1',
        question: 'Are associates and leaders prepared to execute a shelter-in-place or emergency evacuation?',
        procedures: [
          { type: 'instructional', text: 'During the afternoon, and with a store leader of choice, tour the store and inspect emergency procedures flipcharts and speak to associates to assess their knowledge of emergency procedures.' },
          { type: 'actionable', text: 'Determine if emergency procedures flipcharts are current and only in the required locations.', followUp: 'How many flipcharts need updating?' },
          { type: 'actionable', text: 'Interview associates and all leaders and determine if they are knowledgeable about shelter-in-place plans:', followUp: 'How many associates lacked knowledge of shelter-in-place procedures?' },
          { type: 'actionable', text: 'Interview associates and all leaders and determine if they are knowledgeable about evacuation plans:', followUp: 'How many associates lacked knowledge of evacuation procedures?' }
        ],
        rating: {
          green: { points: 2, criteria: 'All emergency flipcharts are updated. Associates and leaders were all knowledgeable about what to do to shelter-in-place and/or evacuate.' },
          yellow: { points: 1, criteria: 'Most associates and all leaders were all knowledgeable about what to do to shelter-in-place and/or evacuate.' },
          red: { points: 0, criteria: 'More than half of the associates were unaware of how to shelter-in-place and/or evacuate the facility.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 3 }
      },
      {
        id: 'cu_pc_2',
        question: 'Are all power lifting equipment (PLE) procedures for training, safety, maintenance, and usage followed?',
        procedures: [
          { type: 'instructional', text: 'With a store leader, tour and review the following:' },
          { type: 'actionable', text: 'Determine if there are an adequate number of certified PLE trainers are available on each shift.', followUp: 'How many shifts lack adequate certified trainers?' },
          { type: 'actionable', text: 'Review the PLE Toolkit for requirements to become a certified trainer.', followUp: 'How many trainer requirements are not being met?' },
          { type: 'actionable', text: 'Verify all current trainers are updated on their ULearn requirements.', followUp: 'How many trainers need ULearn updates?' },
          { type: 'actionable', text: 'Review the PLE Operator Certification Report for all current associates who are trained to operate PLE and ensure there is no shortage', followUp: 'How many associates need PLE certification?' },
          { type: 'actionable', text: 'Review PLE Pre-Operational Checklists for the past 12 weeks, and determine if inspections are being conducted.', followUp: 'What percentage of required inspections were NOT completed?' },
          { type: 'actionable', text: 'Validate that keys are not kept inside the equipment, but in the designated location.', followUp: 'How many equipment keys were found in improper locations?' }
        ],
        rating: {
          green: { points: 2, criteria: 'All PLE certified trainers are current. All associates who appear to be operating equipment are licensed. Pre-Operational Checklists are completed daily and are accurate. All equipment is operated safely.' },
          yellow: { points: 1, criteria: 'This question does not have a Yellow rated option, because of the severity of non-compliance' },
          red: { points: 0, criteria: 'Any evidence of non-compliance with established processes are found.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 0 }
      },
      {
        id: 'cu_pc_3',
        question: 'Are overnight leaders and associates utilizing Sidekick to plan and execute stocking work?',
        procedures: [
          { type: 'instructional', text: 'With the Store Manager, review the following:' },
          { type: 'actionable', text: 'The only real evidence available is determining if any preferences have been set for associates within Sidekick. Navigate to Sidekick in MyWalmart and determine if store leadership has set preferences for stocking associates.', followUp: 'How many associates lack Sidekick preferences?' },
          { type: 'actionable', text: 'Review the Connected Associate Asset Report to determine if overnight associates have been issued a device.', followUp: 'What percentage of overnight associates lack devices?' },
          { type: 'actionable', text: 'Discuss how the store leadership team planned, trained, and rolled out Sidekick.', followUp: 'How many rollout deficiencies were identified?' },
          { type: 'actionable', text: 'Work with the Store Manager to determine the level of follow up conducted to make sure overnight leaders are using Sidekick.', followUp: 'How many weeks have passed without follow-up sessions?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Sidekick appears to be consistently used. Preferences for associates have been set. All overnight associates have been issued a device. There was a clear rollout plan for the facility and follow up is conducted regularly.' },
          yellow: { points: 1, criteria: 'There have been some attempts to use Sidekick, but it has been inconsistent. At least 50% of overnight associates have been issued devices.' },
          red: { points: 0, criteria: 'There has been no attempt to use Sidekick since its launch or a majority of overnight associates have not been issued devices.' }
        },
        scoringType: 'performance',
        thresholds: { green: 10, yellow: 50 }
      },
      {
        id: 'cu_pc_4',
        question: 'Are associates at the entrance providing a consistently friendly and respectful experience?',
        procedures: [
          { type: 'instructional', text: 'With the asset protection or frontend leader, observe associate interactions with customers at the entrances:' },
          { type: 'actionable', text: 'Observe live associate interactions with customers: Are associates greeting customers when they enter, Are associates providing a safe entrance experience, are associates are checking receipts, are they being consistent in asking customers with unbagged items to see their receipt?', followUp: 'How many negative customer interactions were observed?' },
          { type: 'actionable', text: 'Review historical CCTV footage of the entrances during peak weekend times and evenings: Are associates appearing to engage customers when they enter? Are associates providing a safe entrance experience? If associates are checking receipts, are they being consistent in asking customers with unbagged items to see their receipt?', followUp: 'How many instances of inconsistent entrance procedures were observed?' },
          { type: 'actionable', text: 'Review MyCustomer customer comments to determine if any comments have been left within the last 13 weeks regarding associates at the entrances. If there are negative customer comments, determine the level of follow up conducted. If there are positive customer comments, determine what recognition took place.', followUp: 'How many negative customer comments were related to entrance experience?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Associates at the entrances appear to be providing a consistently friendly and respectful experience. Customer comments have been followed up to.' },
          yellow: { points: 1, criteria: 'Associates are providing an inconsistent experience for our customers. Some customer comments have been followed up to.' },
          red: { points: 0, criteria: 'Associates are clearly not providing a consistent friendly and respectful experience due to observations or negative customer comments.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 3 }
      },
      {
        id: 'cu_pc_5',
        question: 'Are fitting rooms consistently clean and available for customer use?',
        procedures: [
          { type: 'instructional', text: 'With the coach over apparel or an apparel team lead:' },
          { type: 'actionable', text: 'Conduct a tour of the fitting room spaces: Are all fitting rooms clean and organized (without merchandise)? Are all fixtures secured, in good condition, and free from safety hazards? Are all lighting fixtures in good condition? Are all fitting room doors locked by default? Are CCTV domes obscured from view while within the fitting rooms?', followUp: 'How many fitting rooms need attention?' },
          { type: 'actionable', text: 'Review the fitting room workstation (legacy fitting rooms): Is the area neat, clean and organized? Is the switchboard phone and walkie-talkies functioning?', followUp: 'How many workstation deficiencies were identified?' },
          { type: 'actionable', text: 'Review if there is a call button available: In fashion fitting rooms (with no workstation) check the call button to make sure it reaches an associate on the fashion pad. In legacy fitting rooms (with workstation) a call button is not required, but highly suggested if open-to-close coverage on the fitting room isn\'t feasible.', followUp: 'How many call button malfunctions were found?' },
          { type: 'actionable', text: 'Review MyCustomer customer comments to determine if any comments have been left within the last 13 weeks regarding the fitting rooms. If there are negative customer comments, determine the level of follow up conducted. If there are positive customer comments, determine what recognition took place.', followUp: 'How many negative customer comments were related to fitting rooms?' }
        ],
        rating: {
          green: { points: 2, criteria: 'Fitting rooms are in excellent presentation, safety, and security conditions. Associates are available and respond quickly.' },
          yellow: { points: 1, criteria: 'Fitting rooms are in somewhat good physical condition; safety and security conditions are excellent; associates intermittently respond.' },
          red: { points: 0, criteria: 'Fitting rooms are not in good condition; there are safety or security issues that need to be addressed; associate response needs to be improved.' }
        },
        scoringType: 'exceptions',
        thresholds: { green: 0, yellow: 3 }
      }
    ],
    foundations: []
  }
};

export const SCORING_THRESHOLDS = {
  exceptions: {
    green: 0,
    yellow: 10
  },
  performance: {
    green: 90,
    yellow: 70
  }
};

export const SCORE_COLORS = {
  green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
};

