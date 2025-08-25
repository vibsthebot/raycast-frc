import { Action, ActionPanel, List } from "@raycast/api";

export default function Command({ arguments: { event } }: { arguments: Arguments.FtcEvent }) {
  return (
    <List isShowingDetail={true} filtering={false}>
      <List.Item
        title={`Event ${event}`}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser url={`https://ftcstats.org/event/${event}`} title="View Event on FTC Stats" />
          </ActionPanel>
        }
        subtitle={`Loading...`}
      />
    </List>
  );
}
