import { useState } from "react";

interface Arguments {
    event: string;
}

interface EventData {
    id: string;
    name: string;
    date: string;
    location: string;
}

export default function Command({ arguments: { event } }: { arguments: Arguments }) {
    const [eventData, setEventData] = useState<EventData | null>(null);
}