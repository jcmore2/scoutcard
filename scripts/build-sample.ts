// One-off dev script: builds sample/sample-export.zip, a fake LinkedIn
// export used to test the pipeline without needing anyone's real data.
import AdmZip from "adm-zip";
import { mkdirSync } from "node:fs";

const profileCsv = `"First Name","Last Name","Maiden Name","Address","Birth Date","Headline","Summary","Industry","Zip Code","Geo Location","Twitter Handles","Websites","Instant Messengers"
"Jane","Scout","","","","Senior Software Engineer @ Acme","Building things that scale.","Software Development","","San Francisco Bay Area","","",""
`;

const positionsCsv = `"Company Name","Title","Description","Location","Started On","Finished On"
"Acme Corp","Senior Software Engineer","Leading the backend platform team","San Francisco, CA","Jan 2021",""
"Beta Inc","Software Engineer","Full stack development","Remote","Jun 2017","Dec 2020"
"Gamma Startup","Junior Developer","Early engineering hire","Austin, TX","Aug 2015","May 2017"
`;

const skillsCsv = `"Name"
"TypeScript"
"React"
"Node.js"
"System Design"
"Kubernetes"
"PostgreSQL"
"GraphQL"
"AWS"
`;

const connectionsRows = Array.from({ length: 42 }, (_, i) =>
  `"Person${i}","Sample","https://www.linkedin.com/in/person${i}","","Company ${i % 7}","Engineer","0${(i % 9) + 1} Jan 202${i % 4}"`,
).join("\n");
const connectionsCsv = `Notes:
"When exporting your connection data, you will only see the data provided by connections who allow you to view their data."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
${connectionsRows}
`;

const recsReceivedCsv = `"First Name","Last Name","Text","Creation Date","Status"
"Alex","Manager","Jane is a fantastic engineer and mentor.","01 Mar 2023","VISIBLE"
"Sam","Lead","Great collaborator, always ships on time.","15 Jun 2022","VISIBLE"
`;

const recsGivenCsv = `"First Name","Last Name","Text","Creation Date","Status"
"Riley","Peer","Riley is sharp and a great teammate.","10 Apr 2023","VISIBLE"
`;

const endorsementRows = Array.from({ length: 18 }, (_, i) =>
  `"Endorser${i}","Person","TypeScript","01 Jan 202${i % 4}"`,
).join("\n");
const endorseReceivedCsv = `"Endorser First Name","Endorser Last Name","Skill Name","Endorsement Date"
${endorsementRows}
`;
const endorseGivenCsv = `"Endorsee First Name","Endorsee Last Name","Skill Name","Endorsement Date"
"Casey","Peer","React","02 Feb 2023"
"Jordan","Peer","Node.js","03 Mar 2023"
`;

const activityRows = Array.from({ length: 10 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i * 20);
  return `"https://www.linkedin.com/feed/update/urn:li:share:${1000 + i}","Sharing some thoughts on scaling systems.","${d.toISOString()}","MEMBER_NETWORK"`;
}).join("\n");
const sharesCsv = `"Share Link","ShareCommentary","Date","Visibility"
${activityRows}
`;
const commentsCsv = `"Date","Link","Comment"
"${new Date().toISOString()}","https://www.linkedin.com/feed/update/urn:li:share:2000","Congrats on the launch!"
`;

const zip = new AdmZip();
zip.addFile("Profile.csv", Buffer.from(profileCsv));
zip.addFile("Positions.csv", Buffer.from(positionsCsv));
zip.addFile("Skills.csv", Buffer.from(skillsCsv));
zip.addFile("Connections.csv", Buffer.from(connectionsCsv));
zip.addFile("Recommendations_Received.csv", Buffer.from(recsReceivedCsv));
zip.addFile("Recommendations_Given.csv", Buffer.from(recsGivenCsv));
zip.addFile("Endorsement_Received_Info.csv", Buffer.from(endorseReceivedCsv));
zip.addFile("Endorsement_Given_Info.csv", Buffer.from(endorseGivenCsv));
zip.addFile("Shares.csv", Buffer.from(sharesCsv));
zip.addFile("Comments.csv", Buffer.from(commentsCsv));

mkdirSync("sample", { recursive: true });
zip.writeZip("sample/sample-export.zip");
console.log("Wrote sample/sample-export.zip");
