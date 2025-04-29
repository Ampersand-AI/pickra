
import { v4 as uuidv4 } from "uuid";

export const generateMockJobRequirements = () => {
  return [
    {
      id: uuidv4(),
      title: "Frontend Developer",
      description: "We're looking for a Frontend Developer with expertise in React, TypeScript, and modern CSS frameworks.",
      skills: [
        { name: "React", weight: 5 },
        { name: "TypeScript", weight: 4 },
        { name: "HTML/CSS", weight: 3 },
        { name: "Tailwind CSS", weight: 2 },
      ],
      experience: { years: 2, weight: 3 },
      education: { level: "Bachelor's", weight: 1 }
    },
    {
      id: uuidv4(),
      title: "Full Stack Developer",
      description: "Seeking a Full Stack Developer proficient in both frontend and backend technologies.",
      skills: [
        { name: "JavaScript", weight: 5 },
        { name: "Node.js", weight: 4 },
        { name: "React", weight: 4 },
        { name: "MongoDB", weight: 3 },
        { name: "Express", weight: 3 },
      ],
      experience: { years: 3, weight: 4 },
      education: { level: "Bachelor's", weight: 2 }
    },
  ];
};

export const generateMockResumes = (count = 5) => {
  const fileTypes = ["pdf", "docx", "pdf", "doc", "pdf"];
  const fileNames = [
    "John_Smith_Resume",
    "Jane_Doe_CV",
    "Michael_Johnson_Resume",
    "Emily_Williams_CV",
    "David_Brown_Resume",
    "Sarah_Miller_CV",
    "Robert_Wilson_Resume",
    "Jennifer_Taylor_CV",
    "William_Anderson_Resume",
    "Elizabeth_Thomas_CV"
  ];
  
  return Array(count).fill(null).map((_, index) => {
    const fileExt = fileTypes[index % fileTypes.length];
    const fileName = `${fileNames[index % fileNames.length]}.${fileExt}`;
    const fileSize = Math.floor(Math.random() * 5 * 1024 * 1024) + 500000; // 500KB - 5MB
    
    return {
      id: uuidv4(),
      fileName: fileName,
      fileSize: fileSize,
      uploadDate: new Date(),
      processed: Math.random() > 0.3, // 70% are processed
      matchPercentage: Math.random() > 0.3 ? Math.floor(Math.random() * 70) + 30 : undefined, // 30-100%
      extractedData: Math.random() > 0.3 ? {
        name: fileName.split("_").slice(0, 2).join(" ").replace(`.${fileExt}`, ""),
        email: `${fileName.split("_")[0].toLowerCase()}@example.com`.replace(`.${fileExt}`, ""),
        phone: `555-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}`,
        skills: [
          "JavaScript",
          "React",
          "TypeScript",
          "HTML",
          "CSS",
          "Node.js",
          "Express",
          "Git",
        ].filter(() => Math.random() > 0.3),
        experience: [
          {
            title: "Frontend Developer",
            company: "Tech Company Inc.",
            years: Math.floor(Math.random() * 5) + 1
          },
          {
            title: "Web Developer",
            company: "Digital Solutions LLC",
            years: Math.floor(Math.random() * 3) + 1
          }
        ],
        education: [
          {
            degree: ["Bachelor's", "Master's", "PhD"][Math.floor(Math.random() * 3)],
            institution: "University of Technology",
            year: 2015 + Math.floor(Math.random() * 8)
          }
        ]
      } : undefined
    };
  });
};
