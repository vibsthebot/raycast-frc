import { Detail, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { config } from "./config";

interface Arguments {
  team: string;
}

interface Event {
  key: string;
  name: string;
  city: string;
  state_prov: string;
  country: string;
  matches: Match[];
  status: string;
  awards: string[];
}
interface Match {
  key: string;
  red1: string;
  red2: string;
  red3: string;
  blue1: string;
  blue2: string;
  blue3: string;
  scoreBlue: number;
  scoreRed: number;
  predBlue: number;
  predRed: number;
}

interface TeamData {
  nickname: string;
  city: string;
  state_prov: string;
  country: string;
  district: string;
  epa: number;
  wins: number;
  losses: number;
  ties: number;
  competing: boolean;
  district_points: number;
  district_rank: number;
  events: Event[];
}

function getDistrictName(code: string) : string | null {
  const districtMap: { [key: string]: string } = {
    "ONT": "FIRST Canada - Ontario",
    "FMA": "FIRST Mid-Atlantic",
    "ISR": "FIRST Israel",
    "CHS": "FIRST Chesapeake",
    "FIT": "FIRST In Texas",
    "PCH": "Peachtree",
    "PNW": "Pacific Northwest",
    "FIM": "FIRST in Michigan",
    "FSC": "FIRST South Carolina",
    "FNC": "FIRST North Carolina",
    "FIN": "FIRST Indiana Robotics",
    "NE":  "New England"
  };
  return districtMap[code.toUpperCase()] || null;
}

export default function Command({ arguments: { team } }: { arguments: Arguments }) {
  if (!team || isNaN(Number(team))) {
    console.log(Number(team));
    return <Detail markdown="# Invalid Team Number" />;
  }
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const year = new Date().getFullYear();
  const markdown = `
# Team ${team}${teamData ? ` - ${teamData.nickname}` : ""}  
<img src="https://www.thebluealliance.com/avatar/${year}/frc${team}.png" width="40" />
From ${teamData ? `${teamData.city}, ${teamData.state_prov}, ${teamData.country}` : ""} 

${teamData && teamData.epa ? `**Record:** ${teamData ? `${teamData.wins}-${teamData.losses}-${teamData.ties}` : "N/A"}  

**EPA:** ${teamData?.epa ?? "N/A"}` : ""}

${teamData?.district ? `As a member of the ${getDistrictName(teamData.district)} district, Team ${team} ranked #${teamData.district_rank} having earned ${teamData.district_points} points.` : ""}

[View on TBA](https://www.thebluealliance.com/team/${team}) / [View on Statbotics](https://api.statbotics.io/v3/team_year/${team}/)`;

  useEffect(() => {
    async function fetchData() {
      try {
        const tbaResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}`, {
          headers: {
            "X-TBA-Auth-Key": config.TBA_API_KEY
          }
        });
        const tbaData = await tbaResponse.json();
        setTeamData(tbaData)
        const statboticsResponse = await fetch(`https://api.statbotics.io/v3/team_year/${team}/${year}`);
        const statboticsData = await statboticsResponse.json();

        const eventListResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${year}/simple`, {
          headers: {
            "X-TBA-Auth-Key": config.TBA_API_KEY
          }
        });
        const eventListRaw = await eventListResponse.json();
        let processedTeamData = {
          ...tbaData,
          epa: statboticsData.epa?.total_points?.mean || 0,
          wins: statboticsData.record.wins || 0,
          losses: statboticsData.record.losses || 0,
          ties: statboticsData.record.ties || 0,
          district: statboticsData.district || null,
          district_points: statboticsData.district_points || 0,
          district_rank: statboticsData.district_rank || 0,
        };
        setTeamData(processedTeamData);
        const events: Event[] = eventListRaw.map((event: any) => ({
          key: event.key,
          name: event.name,
          city: event.city,
          state_prov: event.state_prov,
          country: event.country,
          matches: []
        }));
        for (const event of events) {
          const eventStatus = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/event/${event.key}/status`, {
            headers: {
              "X-TBA-Auth-Key": config.TBA_API_KEY
            }
          });
          
          const eventStatusData = await eventStatus.json();
          //console.log(eventStatusData);
          const eventAwards = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/event/${event.key}/awards`, {
            headers: {
              "X-TBA-Auth-Key": config.TBA_API_KEY
            }
          });
          const eventAwardsData = await eventAwards.json();

          if (eventAwardsData) {
            event.awards = eventAwardsData.map((award: any) => award.name) || [];
          }
          if (eventStatusData) {
            event.status = eventStatusData.overall_status_str || "";
          }

          const matchList = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/event/${event.key}/matches/keys`, {
            headers: {
              "X-TBA-Auth-Key": config.TBA_API_KEY
            }
          });
          const matchListData = await matchList.json();
          let matches: Match[] = [];
          if (matchListData.length > 0) {
            for (const matchKey of matchListData) {
              const curMatch = await fetch(`https://api.statbotics.io/v3/match/${matchKey}`);
              const curMatchData = await curMatch.json();
              if (curMatchData) {
                const matchData: Match = {
                  key: curMatchData.key,
                  red1: curMatchData.alliances.red.team_keys[0],
                  red2: curMatchData.alliances.red.team_keys[1],
                  red3: curMatchData.alliances.red.team_keys[2],
                  blue1: curMatchData.alliances.blue.team_keys[0],
                  blue2: curMatchData.alliances.blue.team_keys[1],
                  blue3: curMatchData.alliances.blue.team_keys[2],
                  scoreBlue: curMatchData.result.blue_score,
                  scoreRed: curMatchData.result.red_score,
                  predBlue: Math.round(curMatchData.pred.blue_score),
                  predRed: Math.round(curMatchData.pred.red_score)
                }
                matches.push(matchData);
              }
            }
          }
          console.log(matches);
          event.matches = matches;
          processedTeamData = {
            ...tbaData,
            epa: statboticsData.epa?.total_points?.mean || 0,
            wins: statboticsData.record.wins || 0,
            losses: statboticsData.record.losses || 0,
            ties: statboticsData.record.ties || 0,
            district: statboticsData.district || null,
            district_points: statboticsData.district_points || 0,
            district_rank: statboticsData.district_rank || 0,
            events
          };
          setTeamData(processedTeamData);
        }
        processedTeamData = {
          ...tbaData,
          epa: statboticsData.epa?.total_points?.mean || 0,
          wins: statboticsData.record.wins || 0,
          losses: statboticsData.record.losses || 0,
          ties: statboticsData.record.ties || 0,
          district: statboticsData.district || null,
          district_points: statboticsData.district_points || 0,
          district_rank: statboticsData.district_rank || 0,
          events
        };
        setTeamData(processedTeamData);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, [team]);
       
  return (
    <List isShowingDetail={true} filtering={false}>
        <List.Item
          title={`Team ${team}`}
          detail={<List.Item.Detail markdown={markdown} />}
          subtitle={teamData && teamData.epa ? `EPA: ${teamData.epa}` : ""}
        />
      {teamData?.events && Object.keys(teamData.events).length > 0 && (
        <List.Section title="Events">
          {teamData.events.map((event, index) => (
            <List.Item
              key={index}
              title={event.name}
              subtitle={`${event.city}, ${event.state_prov}`}
              detail={<List.Item.Detail markdown={`
# ${event.name}
(${event.key}) - [View on TBA](https://www.thebluealliance.com/event/${event.key}) / [View on Statbotics](https://api.statbotics.io/v3/event/${event.key})

${event.city}, ${event.state_prov}, ${event.country}

${htmlToMarkdown(event.status)}

${event.awards && event.awards.length > 0 ? "They also won the following awards: \n * " + event.awards.join("\n * ") : ""}

${getMatchesTable(event?.matches)}`}/>}
            />
          ))}
        </List.Section>
      )}
      </List>
  );
}

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  let md = html;
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');
  return md.trim();
}

function getMatchesTable(matches: Match[]): string {
  if (!matches || matches.length === 0) return "No matches found.";
  let table = '';
  let semifinals_header = '';
  let finals_header = '';
  const qms = matches.filter(m => m.key.replace(/^[^_]+_/, '').startsWith('qm'));
  qms.sort((a, b) => {
    const aNum = parseInt(a.key.replace(/^[^_]+_qm/, ''));
    const bNum = parseInt(b.key.replace(/^[^_]+_qm/, ''));
    return aNum - bNum;
  });
  if (qms.length > 0) {
    table += '**Qualifications** \n| Match | Red | Blue | Pred Red | Pred Blue | Red | Blue |\n| --- | --- | --- | --- | --- | --- | --- |\n';
    for (const match of qms) {
      const trimmedKey = match.key.replace(/^[^_]+_/, '');
      const qmMatch = trimmedKey.match(/^qm(\d+)/);
      const matchName = qmMatch ? `Quals ${qmMatch[1]}` : trimmedKey;
      table += `| ${matchName} | ${match.red1}, ${match.red2}, ${match.red3} | ${match.blue1}, ${match.blue2}, ${match.blue3} | ${match.predRed} | ${match.predBlue} | ${match.scoreRed} | ${match.scoreBlue} |\n`;
    }
  }
  const sfs = matches.filter(m => m.key.replace(/^[^_]+_/, '').startsWith('sf'));
  sfs.sort((a, b) => {
    const aTrim = a.key.replace(/^[^_]+_/, '');
    const bTrim = b.key.replace(/^[^_]+_/, '');
    const aChar = aTrim[2];
    const bChar = bTrim[2];
    if (aChar < bChar) return -1;
    if (aChar > bChar) return 1;
    return 0;
  });
  if (sfs.length > 0) {
    semifinals_header = '\n **Semifinals** \n| Match | Red | Blue | Pred Red | Pred Blue | Red | Blue |\n| --- | --- | --- | --- | --- | --- | --- |\n';
    table += semifinals_header;
    for (const match of sfs) {
      const trimmedKey = match.key.replace(/^[^_]+_/, '');
      const sfMatch = trimmedKey.match(/^sf\d+m(\d+)/);
      const matchName = sfMatch ? `Match ${trimmedKey[2]}` : trimmedKey;
      table += `| ${matchName} | ${match.red1}, ${match.red2}, ${match.red3} | ${match.blue1}, ${match.blue2}, ${match.blue3} | ${match.predRed} | ${match.predBlue} | ${match.scoreRed} | ${match.scoreBlue} |\n`;
    }
  }
  const finals = matches.filter(m => m.key.replace(/^[^_]+_/, '').startsWith('f'));
  finals.sort((a, b) => {
    const aTrim = a.key.replace(/^[^_]+_/, '');
    const bTrim = b.key.replace(/^[^_]+_/, '');
    const aMatch = aTrim.match(/^f(\d+)m(\d+)/);
    const bMatch = bTrim.match(/^f(\d+)m(\d+)/);
    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[2]);
      const bNum = parseInt(bMatch[2]);
      return aNum - bNum;
    }
    return aTrim.localeCompare(bTrim);
  });
  if (finals.length > 0) {
    finals_header = '\n **Finals** \n| Match | Red | Blue | Pred Red | Pred Blue | Red | Blue |\n| --- | --- | --- | --- | --- | --- | --- |\n';
    table += finals_header;
    for (const match of finals) {
      const trimmedKey = match.key.replace(/^[^_]+_/, '');
      const fMatch = trimmedKey.match(/^f\d+m(\d+)/);
      const matchName = fMatch ? `Finals ${fMatch[1]}` : trimmedKey;
      table += `| ${matchName} | ${match.red1}, ${match.red2}, ${match.red3} | ${match.blue1}, ${match.blue2}, ${match.blue3} | ${ match.predRed > match.predBlue ? `**${match.predRed}**` : match.predRed} | ${ match.predBlue > match.predRed ? `**${match.predBlue}**` : match.predBlue} | ${match.scoreRed > match.scoreBlue ? `**${match.scoreRed}**` : match.scoreRed} | ${match.scoreBlue > match.scoreRed ? `**${match.scoreBlue}**` : match.scoreBlue} |\n`;
    }
  }
  return table;
}
