import type { IconName } from "@/components/Icon";

export const SUPPORT_EMAIL = "mail@homedotapp.com";
export const EFFECTIVE_DATE = "May 25, 2020";
export const COPYRIGHT = "Copyright @ 2026 HomeDot All Rights Reserved";

export interface PrivacySubList {
  heading?: string;
  items: string[];
}

export interface PrivacySection {
  id: string;
  icon: IconName;
  title: string;
  paragraphs?: string[];
  lists?: PrivacySubList[];
}

// Verbatim from https://homedotapp.com/privacy — section order, headings and
// wording all mirror the live page exactly; only the layout (icons, card
// chrome, table of contents) is this app's own.
export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "collection",
    icon: "edit",
    title: "Information Collection and Use",
    paragraphs: [
      `The application collects varying types of information depending on usage, including "Name, Profile Photo, and contact information."`,
    ],
    lists: [
      {
        heading: "Registration & Profile",
        items: ["Name/username and telephone number", "Profile photo upload option", "Content posting and sharing", "Messages and communications"],
      },
      {
        heading: "Content & Communications",
        items: ["Information about content you provide", "Metadata (location, date created)", "Messages and interactions", "Shared images and media"],
      },
    ],
  },
  {
    id: "contacts",
    icon: "user",
    title: "Contact List Access",
    paragraphs: [
      `The app collects contact lists to "Help you follow other professionals in your contacts" and "Help you invite friends and coworkers to our service."`,
      `Users "can deny this request and continue to use the app." The service may also "collect your phone number from other people using our Service if you are in their contact lists."`,
      `When contacting support, users may provide "name, email address, phone number, and the contents of your support issue."`,
    ],
  },
  {
    id: "transactions",
    icon: "briefcase",
    title: "Transaction Information",
    paragraphs: [
      `For purchases or financial transactions, the company collects payment-related data including "Credit or debit card information, Account and authentication information, Billing, shipping and contact details."`,
    ],
  },
  {
    id: "device",
    icon: "settings",
    title: "Device Information",
    lists: [
      {
        heading: "Device Attributes",
        items: ["Operating system information", "Hardware and software versions", "Battery level and signal strength", "Available storage space", "Browser type and app information"],
      },
      { heading: "Device Signals", items: ["Bluetooth signals", "Wi-Fi access points information", "Beacons and cell towers"] },
      { heading: "Device Settings", items: ["GPS location (if enabled)", "Camera access (if enabled)", "Photo access (if enabled)"] },
      {
        heading: "Network Connections",
        items: ["Name of your mobile operator or ISP", "Language", "Time zone", "Mobile phone number", "IP address", "Connection speed"],
      },
    ],
  },
  {
    id: "third-party",
    icon: "share",
    title: "Third-Party Integrations",
    paragraphs: [
      `"When you choose to use third-party apps, websites, or other services that use, or are integrated with, our Products, they can receive information about what you post or share."`,
      `The company uses information to "Identify you as a user in our system, Provide improved administration of our Site and Services, Provide the Services you request, Improve the quality of your experience, Send you email notifications, Send newsletters, surveys, offers, and promotional materials, Protect our services and users, Market and customer analysis, research and statistics, Prevent and detect fraud or abuse."`,
    ],
    lists: [{ heading: "Third-Party Service Providers", items: ["Google Play Services", "Google Analytics for Firebase", "Firebase Crashlytics"] }],
  },
  {
    id: "friends",
    icon: "heart",
    title: "Information about Your Friends",
    paragraphs: [
      `Users can invite friends by sharing contact information. "We only use this information to Send them your invitation" and "Process the request securely." The company does "not use your friends' contact details for any other purpose."`,
    ],
  },
  {
    id: "messages",
    icon: "chat",
    title: "Information about Your Messages",
    paragraphs: [
      `The company may "Store messages to process and deliver them, Allow you to view/manage past conversations, Investigate violations of our Terms of Service."`,
      `For SMS content, the service may log phone number, mobile carrier, and "The date and time the message was processed."`,
    ],
  },
  {
    id: "automatic",
    icon: "compass",
    title: "Automatically Collected Information",
    lists: [
      {
        heading: "Device & Usage Data",
        items: [
          "IP address, browser, OS, device type and unique ID",
          "Connection type, speed, and carrier",
          "Date/time of visits, pages viewed, click activity",
          "Error logs and crash reports",
        ],
      },
      {
        heading: "Location & Stored Files",
        items: [
          "Real-time device location (with permission)",
          "Metadata from stored media (photos, videos, etc.)",
          "Contacts/address book for personalization",
          "Last visited URL before coming to our app",
        ],
      },
    ],
    // Mobile Device IDs note rendered as trailing paragraphs below the lists.
  },
  {
    id: "mobile-device-ids",
    icon: "phone",
    title: "Mobile Device IDs",
    paragraphs: [
      `Device identifiers are "Used by analytics/advertising to enhance your experience." Note: "Device IDs cannot be deleted like cookies."`,
    ],
  },
  {
    id: "log-data",
    icon: "book",
    title: "Log Data",
    paragraphs: [
      `App errors may generate Log Data including "IP address, Device name, OS version, App configuration at crash time, Timestamp and technical details."`,
    ],
  },
  {
    id: "cookies",
    icon: "grid",
    title: "Cookies",
    paragraphs: [
      `"Our app may use third-party libraries or services that employ cookies."`,
      `Users can "Accept or refuse cookies" and "Be notified when a cookie is being sent." Note: "Refusing cookies may impact your experience."`,
    ],
  },
  {
    id: "service-providers",
    icon: "briefcase",
    title: "Service Providers",
    paragraphs: [
      `The company may work with "third parties to Operate or provide the Service, Analyze how our Service is used."`,
      `Partners "may access your Personal Information only to perform tasks on our behalf and are contractually obligated not to misuse it."`,
    ],
  },
  {
    id: "data-deletion",
    icon: "trash",
    title: "Data Deletion",
    paragraphs: [
      `Users have "the right to delete your account and associated data anytime."`,
      `Email: ${SUPPORT_EMAIL} to request deletion.`,
      `"All data will be fully erased within 90 days."`,
    ],
  },
  {
    id: "links",
    icon: "arrow",
    title: "Links to Other Sites",
    paragraphs: [`"Our Service may link to external websites."`, `The company is "not responsible for the privacy practices or content of third-party sites."`],
  },
  {
    id: "children",
    icon: "shield",
    title: "Children's Privacy",
    paragraphs: [
      `"Our Services are not intended for users under the age of 13."`,
      `The company does "not knowingly collect data from children under 13. If we become aware of such data, it will be deleted immediately."`,
    ],
  },
  {
    id: "changes",
    icon: "clock",
    title: "Changes to This Privacy Policy",
    paragraphs: [`"We may update this Privacy Policy from time to time."`, `Changes will be posted on the page. Effective Date: ${EFFECTIVE_DATE}`],
  },
  {
    id: "contact",
    icon: "mail",
    title: "Contact Us",
    paragraphs: [`"If you have questions or suggestions regarding our Privacy Policy, contact us at ${SUPPORT_EMAIL}"`],
  },
];
