import fs from 'fs';
import striverProblems from "./striver.js";
import neetcodeProblems from "./neetcode150.js";
import top150InterviewProblems from "./Top150.js";
import blind75Problems from "./Blind75Problems.js";

// We recreate a lightweight registry just for the export
const sheets = [
  { name: "Striver SDE Sheet", problems: striverProblems },
  { name: "NeetCode 150", problems: neetcodeProblems },
  { name: "TOP 150 Interview Problems", problems: top150InterviewProblems },
  { name: "Blind 75", problems: blind75Problems }
];

const finalJson = [];

sheets.forEach(sheet => {
    sheet.problems.forEach(p => {
        finalJson.push({
            title: p.name,            // Transform 'name' to 'title'
            difficulty: p.level,      // Transform 'level' to 'difficulty'
            url: p.lcUrl || p.gfgUrl, // Fallback to GFG if LeetCode URL is missing
            sheet_name: sheet.name    // Inject the parent sheet name
        });
    });
});

fs.writeFileSync("problems.json", JSON.stringify(finalJson, null, 2));
console.log(`Successfully extracted ${finalJson.length} problems to problems.json!`);