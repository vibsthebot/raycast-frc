import { Detail } from "@raycast/api";
import { useEffect, useState } from "react";
import { config } from "./config";

interface Arguments {
  team: string;
}

interface TeamData {
  name: string;
  state: string;
  country: string;
  district: string;
  epa: number;
  wins: number;
  losses: number;
  ties: number;
}

export default function Command({ arguments: { team } }: { arguments: Arguments }) {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const year = new Date().getFullYear();
  
  useEffect(() => {
    async function fetchData() {
      try {
        
        const statboticsResponse = await fetch(`https://api.statbotics.io/v3/team_year/${team}/${year}`);
        const statboticsData = await statboticsResponse.json();
        
        console.log("Raw Statbotics Team data:", statboticsData);
        
        const processedTeamData = { 
          ...statboticsData, 
          epa: statboticsData.epa?.total_points?.mean || 0,
          wins: statboticsData.record.wins || 0,
          losses: statboticsData.record.losses || 0,
          ties: statboticsData.record.ties || 0
        };
        
        setTeamData(processedTeamData);
        console.log("Processed Team data:", processedTeamData);
        console.log(processedTeamData?.epa);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, [team]);

  return <Detail markdown={
    `# Team ${team} - ${teamData?.name} \n
    EPA: ${teamData?.epa} \n
    State/Province: ${teamData?.state} \n
    Country: ${teamData?.country} \n
    ${teamData?.district ? `District: ${teamData.district} \n` : ''}
    `} />;
}
