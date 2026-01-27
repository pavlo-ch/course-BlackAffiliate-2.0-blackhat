export interface Lesson {
  id: string;
  title: string;
  type: 'lesson' | 'homework' | 'questions';
  content?: string;
  contentPath?: string;
  videoUrl?: string;
  files?: string[];
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export const courseData: Section[] = [
  {
    id: 'section-1',
    title: '1. Introduction, Theory and Basics',
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'Welcome to the exciting world of Affiliate Marketing!',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-1.md'
      },
      {
        id: 'lesson-1-2',
        title: 'The Art of Traffic Arbitrage: A Deep Dive',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-2.md'
      },
      {
        id: 'lesson-1-3',
        title: 'Main terms',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-3.md'
      },
      {
        id: 'lesson-1-4',
        title: 'Security on the Internet',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-4.md'
      },
      {
        id: 'lesson-1-5',
        title: 'Cloaking',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-5.md'
      },
      {
        id: 'lesson-1-6',
        title: 'Tracking',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-6.md'
      },
      {
        id: 'lesson-1-7',
        title: 'Accounts FB',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-1-7.md'
      },
      {
        id: 'homework-1-1',
        title: 'Practical Homework',
        type: 'homework',
        contentPath: '@/data/lessons/homework-1-1.md'
      }
    ]
  },
  {
    id: 'section-2',
    title: '2. Preparing the infrastructure',
    lessons: [
      {
        id: 'lesson-2-1',
        title: 'What is an antidetect browser?',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-1.md'
      },
      {
        id: 'lesson-2-2',
        title: '#Proxy for work',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-2.md'
      },
      {
        id: 'lesson-2-3',
        title: 'Working with Facebook Agency Accounts',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-3.md'
      },
      {
        id: 'lesson-2-4',
        title: 'Work with fb accounts, old',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-4.md'
      },
      {
        id: 'lesson-2-5',
        title: 'Types of bans on Facebook',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-5.md'
      },
      {
        id: 'lesson-2-6',
        title: 'Passing the Advertising Activity Ban (ZRD)',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-6.md'
      },
      {
        id: 'lesson-2-7',
        title: 'Pixel FB settings',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-7.md'
      },
      {
        id: 'lesson-2-8',
        title: 'Pixel Conversion API',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-8.md'
      },
      {
        id: 'lesson-2-9',
        title: 'Setting up a Keitaro tracker',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-9.md'
      },
      {
        id: 'lesson-2-10',
        title: 'Cloaking FB',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-10.md'
      },
      {
        id: 'lesson-2-11',
        title: 'Spreadsheet tracker of FB accounts and script for statistics',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-2-11.md'
      },
      {
        id: 'homework-2-1',
        title: 'Homework - Work with accounts and browser anti-detection',
        type: 'homework',
        contentPath: '@/data/lessons/homework-2-1.md'
      },
      {
        id: 'homework-2-2',
        title: 'Homework - Cloaking / Tracking',
        type: 'homework',
        contentPath: '@/data/lessons/homework-2-2.md'
      }
    ]
  },
  {
    id: 'section-3',
    title: '3. System Setup',
    lessons: [
      {
        id: 'lesson-3-1',
        title: 'Ideal customer profile - Prompt',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-1.md'
      },
      {
        id: 'lesson-3-2',
        title: 'Basics of working with the affiliate network',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-2.md'
      },
      {
        id: 'lesson-3-3',
        title: 'Understanding Postbacks for Traffic Arbitrage',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-3.md'
      },
      {
        id: 'lesson-3-4',
        title: 'Choosing the Right Offer',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-4.md'
      },
      {
        id: 'lesson-3-5',
        title: 'Creative Production',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-5.md'
      },
      {
        id: 'lesson-3-6',
        title: 'One hook and CTR to the moon',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-6.md'
      },
      {
        id: 'lesson-3-7',
        title: 'SPY services for Facebook',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-7.md'
      },
      {
        id: 'lesson-3-8',
        title: 'Working with Facebook Fan Page',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-8.md'
      },
      {
        id: 'lesson-3-9',
        title: 'Pre-landing',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-9.md'
      },
      {
        id: 'lesson-3-10',
        title: 'Downloading any landings/sites',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-10.md'
      },
      {
        id: 'lesson-3-11',
        title: 'Where to get payment methods',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-11.md'
      },
      {
        id: 'lesson-3-12',
        title: 'Facebook Traffic Launch Checklist',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-3-12.md'
      },
      {
        id: 'homework-3-1',
        title: 'Homework',
        type: 'homework',
        contentPath: '@/data/lessons/homework-3-1.md'
      }
    ]
  },
  {
    id: 'section-4',
    title: '4. Advertising management and optimization',
    lessons: [
      {
        id: 'lesson-4-1',
        title: 'Setting up and working with metrics',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-1.md'
      },
      {
        id: 'lesson-4-2',
        title: 'What Budget to Use for Launching Ad Campaigns',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-2.md'
      },
      {
        id: 'lesson-4-3',
        title: 'Working with bids',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-3.md'
      },
      {
        id: 'lesson-4-4',
        title: 'FB auction mechanisms',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-4.md'
      },
      {
        id: 'lesson-4-5',
        title: 'Optimization Facebook Ads',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-5.md'
      },
      {
        id: 'lesson-4-6',
        title: 'Technical Audit of Your Funnel',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-6.md'
      },
      {
        id: 'lesson-4-7',
        title: 'Scaling  Campaigns',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-7.md'
      },
      {
        id: 'lesson-4-8',
        title: 'Creating auto-rules',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-8.md'
      },
      {
        id: 'lesson-4-9',
        title: 'New method for bypassing creative moderation',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-4-9.md'
      },
      {
        id: 'homework-4-1',
        title: 'Homework - Questions on the general part',
        type: 'homework',
        contentPath: '@/data/lessons/homework-4-1.md'
      },
    ]
  },
  {
    id: 'section-5',
    title: 'iGaming Technical Flow',
    lessons: [
      {
        id: 'lesson-5-1',
        title: 'How to Promote Gambling in 2025',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-1.md'
      },
      {
        id: 'lesson-5-2',
        title: 'Main Types of Casino Games',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-2.md'
      },
      {
        id: 'lesson-5-3',
        title: 'Link VS Apps',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-3.md'
      },
      {
        id: 'lesson-5-4',
        title: 'A Deeper Dive into PWA',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-4.md'
      },
      {
        id: 'lesson-5-5',
        title: 'PWA',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-5.md'
      },
      {
        id: 'lesson-5-6',
        title: 'Splits: General Information and Features',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-6.md'
      },
      {
        id: 'lesson-5-7',
        title: 'Creating and Configuring a Split Flow',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-7.md'
      },
      {
        id: 'lesson-5-8',
        title: 'PWA Builder',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-8.md'
      },
      {
        id: 'lesson-5-9',
        title: 'Test PWA Installation',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-9.md'
      },
      {
        id: 'lesson-5-10',
        title: 'Integration with Trackers and App Craft',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-10.md'
      },
      {
        id: 'lesson-5-11',
        title: 'Voluum Integration and App Craft',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-11.md'
      },
      {
        id: 'lesson-5-12',
        title: 'Traffic Split Between Campaigns in Trackers',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-12.md'
      },
      {
        id: 'lesson-5-13',
        title: 'Setup - From buying to launching',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-13.md'
      },
      {
        id: 'lesson-5-14',
        title: 'Setting up flow via PWA',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-5-14.md'
      }
    ]
  },
  {
    id: 'section-6',
    title: 'Gambling part 2',
    lessons: [
      {
        id: 'lesson-6-1',
        title: 'Statistics',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-1.md'
      },
      {
        id: 'lesson-6-2',
        title: 'Create a Push Notification',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-2.md'
      },
      {
        id: 'lesson-6-3',
        title: 'Choosing the Right Offer for Gambling',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-3.md'
      },
      {
        id: 'lesson-6-4',
        title: 'Reasons for Low Conversion in Gambling and Betting',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-4.md'
      },
      {
        id: 'lesson-6-5',
        title: 'Case study - ROI 94.21%',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-5.md'
      },
      {
        id: 'lesson-6-6',
        title: 'What Creatives and Promo Materials to Use',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-6.md'
      },
      {
        id: 'lesson-6-7',
        title: 'List of Prohibited/Trigger Words and Phrases',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-7.md'
      },
      {
        id: 'lesson-6-8',
        title: 'Push notification',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-8.md'
      },
      {
        id: 'lesson-6-9',
        title: 'FB Campaign Settings',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-6-9.md'
      }
    ]
  },
  {
    id: 'section-7',
    title: 'Nutra Vertical',
    lessons: [
      {
        id: 'lesson-7-1',
        title: 'How to choose an offer',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-7-1.md'
      },
      {
        id: 'lesson-7-2',
        title: 'Examples: Creatives, Pre-landing pages',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-7-2.md'
      },
      {
        id: 'lesson-7-3',
        title: 'Setup for Nutra vertical',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-7-3.md'
      },
      {
        id: 'lesson-7-4',
        title: 'Launching a campaign for Nutra',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-7-4.md'
      },
      {
        id: 'lesson-7-5',
        title: 'Case Study: $9,450 with Prostanorm Forte',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-7-5.md'
      },
      {
        id: 'lesson-7-6',
        title: 'Drive traffic from Facebook to Nutra in 2025',
        type: 'lesson',
        contentPath: '@/data/lessons/lesson-7-6.md'
      }
    ]
  }
];