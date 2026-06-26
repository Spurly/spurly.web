import { Link } from "react-router-dom";
import BlogLayout from "../../components/BlogLayout.jsx";

export default function PersonalizePost() {
  return (
    <BlogLayout slug="personalize-linkedin-connection-requests">
      <p>
        The difference between a 20% and a 60% acceptance rate on LinkedIn rarely
        comes down to who you are — it comes down to whether your connection
        request feels written <em>for</em> the person reading it. The problem is
        that real personalization takes time, and most people give up and blast
        the same generic note to everyone. Here's how to keep it personal while
        still reaching hundreds of people a week.
      </p>

      <h2>Why generic requests fail</h2>
      <p>
        "Hi, I'd love to connect and grow my network" tells the recipient one
        thing: you sent the exact same message to a thousand other people. People
        accept requests that feel relevant — a shared interest, a comment on their
        work, a reason that's specific to them. Relevance is the whole game.
      </p>

      <h2>The three ingredients of a request that gets accepted</h2>
      <ul>
        <li>
          <strong>A specific hook.</strong> Reference their role, company, a
          recent post, or something concrete you have in common.
        </li>
        <li>
          <strong>A reason.</strong> Why them, why now? Even one honest line beats
          a vague compliment.
        </li>
        <li>
          <strong>Brevity.</strong> Connection notes are capped and skimmed. Two
          or three sentences max.
        </li>
      </ul>

      <h2>How to do it at scale</h2>
      <p>
        The trick is to separate the part of the message that stays the same from
        the part that changes. Write your structure once, then let variables fill
        in the specifics for each person:
      </p>
      <p>
        <em>
          "Hi {"{{name}}"}, I've been following what {"{{company}}"} is doing in
          the space — really impressive. I work with a lot of {"{{title}}"}s on
          exactly this, and would love to connect."
        </em>
      </p>
      <p>
        With a tool like <Link to="/">Spurly</Link>, you capture a whole LinkedIn
        or Sales Navigator search into a Session, drop in your template with{" "}
        <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code> and{" "}
        <code>{"{{title}}"}</code> variables, and it writes a unique message for
        every person — with a live preview before anything sends. You get the
        relevance of one-by-one outreach at the speed of a bulk send.
      </p>

      <h2>A simple weekly rhythm</h2>
      <p>
        Pick one tight audience (e.g. "Heads of Sales at Series A startups"),
        capture the search, send 20–25 personalized requests a day with
        human-like pacing, and follow up with the people who accept. Consistency
        beats volume — a focused, personal list will always outperform a
        spray-and-pray blast.
      </p>

      <p>
        Want the founder's angle on building this into a full pipeline? Read{" "}
        <Link to="/blog/free-linkedin-outreach-pipeline-founders">
          how founders can build a free LinkedIn outreach pipeline
        </Link>
        .
      </p>
    </BlogLayout>
  );
}
