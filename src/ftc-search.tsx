import { Action, ActionPanel, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { TeamData, EventData} from "./ftc-team";
import { time } from "console";

export default function Command() {
  const [data, setData] = useState<TeamData[] | EventData[] | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  async function fetchData(currentSearch: string) {
    if (currentSearch.length > 0 && currentSearch.length < 3) {
      return;
    }
    try {
      const query = `
query ExampleQuery($searchText: String, $limit: Int, $season: Int!) {
  teamsSearch(searchText: $searchText, limit: $limit) {
    name
    number
    location {
      city
      state
      country
    }
    quickStats(season: $season) {
      auto { rank value }
      eg { rank value }
      tot { rank value }
      dc { rank value }
    }
    awards(season: $season) {
      eventCode
      type
    }
  }
  eventsSearch(searchText: $searchText, season: $season, limit: $limit) {
    matches {
      scores {
        ... on MatchScores2024 {
          blue {
            totalPointsNp
          }
          red {
            totalPointsNp
          }
        }
      }
      teams {
        alliance
        teamNumber
      }
      id
      matchNum
      tournamentLevel
      series
    }
    name
    start
    end
    code
  }
}`;
      
      const variables = { searchText: currentSearch, limit: 10, season: 2024 };
      const response = await fetch("https://api.ftcscout.j5155.page/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const json = await response.json();
      if (json.errors) {
        console.error("GraphQL Error:", json.errors);
        setData([]);
      } else if (!json.data || (!json.data.teamsSearch && !json.data.eventsSearch)) {
        setData([]);
      } else {
        let teams = Array.isArray(json.data.teamsSearch) ? json.data.teamsSearch : [];
        let events = Array.isArray(json.data.eventsSearch) ? json.data.eventsSearch : [];
        teams = teams.slice(0, 10);
        events = events.slice(0, 10);
        for (const event of events) {
          event.eventCode = event.code;
        }
        setData([...teams, ...events].filter(Boolean));
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setData([]);
    }
  }

  
  return (
    <List
      isShowingDetail={true}
      filtering={false}
      onSearchTextChange={(value) => {
        setSearchText(value.toString());
        fetchData(value.toString());
      }}
      searchText={searchText}
      isLoading={searchText.length > 0 && data === null}
      throttle={true}
    >
      {data && data.length > 0 ? (
        data.map((item) => {
            if (isTeamData(item)) {
              return (
                <List.Item
                  key={"team-" + item.number}
                  title={`${item.number} - ${item.name}`}
                  subtitle={
                    item.location ? `${item.location.city}, ${item.location.state}, ${item.location.country}` : undefined
                  }
                  detail={
                    <List.Item.Detail
                      markdown={`# Team ${item.number} - ${item.name}
  From ${item.location.city}, ${item.location.state}, ${item.location.country}

  ## Quick Stats
  |               | Total NP | Auto    | Teleop  | Endgame |
  |---------------|----------|---------|---------|---------|
  | **Best OPR**  | ${item.quickStats?.tot?.value !== undefined ? item.quickStats.tot.value.toFixed(2) : "-"} | ${item.quickStats?.auto?.value !== undefined ? item.quickStats.auto.value.toFixed(2) : "-"} | ${item.quickStats?.dc?.value !== undefined ? item.quickStats.dc.value.toFixed(2) : "-"} | ${item.quickStats?.eg?.value !== undefined ? item.quickStats.eg.value.toFixed(2) : "-"} |
  | **Rank**      | ${item.quickStats?.tot?.rank ?? "-"}  | ${item.quickStats?.auto?.rank ?? "-"}  | ${item.quickStats?.dc?.rank ?? "-"}  | ${item.quickStats?.eg?.rank ?? "-"}  |`}
                    />
                  }
                  actions={
                    <ActionPanel>
                      <Action.OpenInBrowser url={`https://ftcstats.org/team/${item.number}`} title="View Team on FTC Stats" />
                    </ActionPanel>
                  }
                />
              );
            } else if (isEventData(item)) {
              return (
                <List.Item
                  key={"event-" + item.eventCode}
                  title={item.name}
                  detail={<List.Item.Detail markdown={`# Event: ${item.name}\nCode: ${item.eventCode}`} />}
                />
              );
            } else {
              return null;
            }
          })
      ) : searchText.length > 0 && data && data.length === 0 ? (
        <List.EmptyView title="No teams found" />
      ) : (
        <List.EmptyView title="Type to search for FTC teams" />
      )}
    </List>
  );
}

function isTeamData(obj: any): obj is TeamData {
  return obj && typeof obj.number === "number" && typeof obj.name === "string" && obj.quickStats !== undefined;
}

function isEventData(obj: any): obj is EventData {
  return obj && typeof obj.name === "string" && obj.eventCode !== undefined;
}