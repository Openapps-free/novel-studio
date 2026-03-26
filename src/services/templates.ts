import { WritingTemplate } from "../types";
import { v4 as uuidv4 } from "uuid";

export const GENRE_TEMPLATES: WritingTemplate[] = [
  {
    id: "fantasy-hero",
    name: "Hero's Journey - Fantasy",
    description: "Classic fantasy adventure following the monomyth structure",
    category: "Fantasy",
    beats: [
      { name: "Ordinary World", description: "The hero's normal life before the adventure", prompt: "Describe the hero's ordinary world - their home, family, and daily life. What makes this world feel lived-in?" },
      { name: "Call to Adventure", description: "The hero receives a challenge or quest", prompt: "What event or person summons the hero to adventure? Why can't they refuse?" },
      { name: "Refusal of the Call", description: "Hero initially hesitates or refuses", prompt: "What fears or obligations cause the hero to hesitate? What ultimately pushes them forward?" },
      { name: "Meeting the Mentor", description: "Hero gains guidance or supernatural aid", prompt: "Who or what guides the hero? What power or knowledge do they provide?" },
      { name: "Crossing the Threshold", description: "Hero commits to the adventure", prompt: "The hero leaves their ordinary world. Describe the moment of commitment and the new world they enter." },
      { name: "Tests, Allies, Enemies", description: "Hero faces challenges and meets characters", prompt: "What obstacles does the hero face? Who becomes their allies? Who are their enemies?" },
      { name: "Approach to Inmost Cave", description: "Hero prepares for major challenge", prompt: "The hero gathers their resources and prepares to face their greatest fear. What is their plan?" },
      { name: "Ordeal", description: "Hero faces greatest fear/death/rebirth", prompt: "Describe the hero's darkest moment. What do they lose, and what do they gain?" },
      { name: "Reward", description: "Hero takes possession of the treasure", prompt: "What has the hero gained? How has this changed them?" },
      { name: "The Road Back", description: "Hero begins the return journey", prompt: "The hero begins the journey home, but new complications arise." },
      { name: "Resurrection", description: "Final test and transformation", prompt: "The hero faces a final test that transforms them. How do they prove their changed nature?" },
      { name: "Return with Elixir", description: "Hero returns changed, bringing healing", prompt: "How does the hero return to their ordinary world? What healing or change do they bring?" }
    ]
  },
  {
    id: "romance-beats",
    name: "Romance Beats",
    description: "Classic romance story structure with meet-cute to happy ending",
    category: "Romance",
    beats: [
      { name: "Meet Cute", description: "The protagonists meet in an interesting way", prompt: "How do the two leads meet? What's the instant attraction or tension?" },
      { name: "Attraction", description: "Forces that keep them apart emerge", prompt: "What draws them together? What external or internal conflicts keep them apart?" },
      { name: "The Deepening", description: "They spend more time together, intimacy grows", prompt: "Describe a scene where they truly connect. What do they reveal about themselves?" },
      { name: "The First Obstacle", description: "A conflict threatens the relationship", prompt: "What external event or internal fear threatens to push them apart?" },
      { name: "The Break", description: "They separate, relationship seems impossible", prompt: "What happens that makes them decide to walk away? Is it a misunderstanding or a real conflict?" },
      { name: "The Dark Moment", description: "One protagonist reaches their lowest point", prompt: "When does everything seem lost? How does this connect to the relationship?" },
      { name: "The Realization", description: "Hero realizes they can't live without the other", prompt: "What triggers the realization that they need this person in their life?" },
      { name: "The Gesture", description: "Grand romantic gesture", prompt: "How does one protagonist show their love in a meaningful way?" },
      { name: "Happy Ending", description: "They commit to each other", prompt: "How do they resolve their conflicts and commit to a future together?" }
    ]
  },
  {
    id: "thriller-structure",
    name: "Thriller Structure",
    description: "High-tension thriller with ticking clock and reveals",
    category: "Thriller",
    beats: [
      { name: "Hook", description: "Open with immediate tension or danger", prompt: "Start with a scene that immediately grabs attention - a crime, a threat, a race against time." },
      { name: "Stakes Established", description: "What's at risk becomes clear", prompt: "What does the protagonist have to lose? Who is in danger?" },
      { name: "First Twist", description: "Something changes the investigation", prompt: "An unexpected discovery changes everything the protagonist thought they knew." },
      { name: "False Victory", description: "It seems like progress, but it's a trap", prompt: "The protagonist thinks they've made progress, but it's actually a setup." },
      { name: "Midpoint Reversal", description: "Major revelation changes everything", prompt: "A major truth is revealed that reframes the entire story." },
      { name: "Race Against Time", description: "Ticking clock forces urgent action", prompt: "What's the deadline? What happens if they fail?" },
      { name: "All Is Lost", description: "Protagonist faces seemingly impossible odds", prompt: "When does everything seem most hopeless? What appears to be lost?" },
      { name: "Final Confrontation", description: "Protagonist faces the antagonist", prompt: "How does the protagonist finally confront the threat? What resources do they use?" },
      { name: "Resolution", description: "Stakes are resolved, justice is served", prompt: "How are the various threads resolved? What has changed?" }
    ]
  },
  {
    id: "scifi-threeact",
    name: "Sci-Fi Three Act",
    description: "Classic three-act structure for science fiction",
    category: "Sci-Fi",
    beats: [
      { name: "World Setup", description: "Introduce the science fiction world/technology", prompt: "What makes this world different from ours? What technology or concept drives the story?" },
      { name: "Inciting Incident", description: "An event that disrupts the status quo", prompt: "What event throws the protagonist's world into chaos?" },
      { name: "First Act End", description: "Protagonist commits to the new world", prompt: "What forces the protagonist to fully engage with the conflict?" },
      { name: "Rising Action", description: "Escalating complications and stakes", prompt: "What obstacles arise? How do the stakes increase?" },
      { name: "Midpoint", description: "Major revelation or shift in perspective", prompt: "What truth does the protagonist discover? How does it change their approach?" },
      { name: "Crisis", description: "All seems lost, protagonist's lowest point", prompt: "When does everything seem most hopeless? What is lost?" },
      { name: "Climax", description: "Final confrontation with the main conflict", prompt: "How does the protagonist face the ultimate challenge? What do they sacrifice?" },
      { name: "Resolution", description: "New status quo is established", prompt: "What is the new normal? What has changed in the world?" }
    ]
  },
  {
    id: "mystery-whipplet",
    name: "Mystery Structure",
    description: "Classic whodunit with clues and red herrings",
    category: "Mystery",
    beats: [
      { name: "The Crime", description: "A crime is committed, usually a murder", prompt: "Who was killed? What are the circumstances? Why is this significant?" },
      { name: "Introduction", description: "The detective/PI enters the case", prompt: "Who is investigating? What makes them unique?" },
      { name: "First Clues", description: "Initial evidence is gathered", prompt: "What physical evidence is found? What do witnesses say?" },
      { name: "Red Herring", description: "A misleading clue that seems important", prompt: "What clue leads investigators in the wrong direction?" },
      { name: "Investigation Deepens", description: "More complications and revelations", prompt: "What hidden connections are revealed? What secrets surface?" },
      { name: "Twist", description: "A major revelation changes the case", prompt: "What new information completely reframes the investigation?" },
      { name: "Second Crime", description: "Another incident raises the stakes", prompt: "Another victim or crime occurs, raising the urgency." },
      { name: "All Clues Converge", description: "The evidence points to the solution", prompt: "How do all the clues come together? What was overlooked?" },
      { name: "The Reveal", description: "The culprit is unmasked", prompt: "Who did it? How were they caught? What was their motive?" },
      { name: "Denouement", description: "The aftermath and justice", prompt: "How is justice served? What happens to the characters?" }
    ]
  },
  {
    id: "horror-structure",
    name: "Horror Structure",
    description: "Building dread and terror for maximum impact",
    category: "Horror",
    beats: [
      { name: "Normal World", description: "Establish normalcy before horror begins", prompt: "What does everyday life look like? Who are the characters?" },
      { name: "First Fright", description: "The first hint that something is wrong", prompt: "What's the first sign that something is not right? Who notices first?" },
      { name: "Dismissal", description: "Characters rationalize the danger", prompt: "Why do the characters ignore or explain away the warning signs?" },
      { name: "Escalation", description: "The threat becomes more real", prompt: "What happens that proves the danger is real? How do characters react?" },
      { name: "Forced Entry", description: "Characters cannot escape the threat", prompt: "What blocks their escape? Why can't they run?" },
      { name: "The Threat Manifests", description: "The horror becomes undeniable", prompt: "What is the true nature of the threat? What does it want?" },
      { name: "All Is Lost", description: "Characters face seemingly certain death", prompt: "When does hope seem lost? What seems certain to be lost?" },
      { name: "Final Confrontation", description: "Characters face the horror directly", prompt: "How do they fight back? What resources do they have?" },
      { name: "Aftermath", description: "The survivors deal with the aftermath", prompt: "What lingers? How have the characters changed? Is the threat truly gone?" }
    ]
  },
  {
    id: "literary-fiction",
    name: "Literary Fiction",
    description: "Character-driven story with thematic depth",
    category: "Literary",
    beats: [
      { name: "Character in Situation", description: "Introduce character in their current life", prompt: "Who is your protagonist? What's their current situation? What do they want?" },
      { name: "Desire", description: "What the protagonist truly wants emerges", prompt: "Deep beneath the surface want, what does the character truly desire?" },
      { name: "Disruption", description: "An event disrupts their world", prompt: "What event challenges their worldview or their path to desire?" },
      { name: "Response", description: "How the character responds to disruption", prompt: "What does the character do? How do they try to maintain balance?" },
      { name: "Complications", description: "Internal and external obstacles arise", prompt: "What internal conflicts arise? What external obstacles block their path?" },
      { name: "Insight", description: "Character gains self-knowledge", prompt: "What does the character realize about themselves? About others?" },
      { name: "Choice", description: "Character must make a difficult decision", prompt: "What choice must they make? What are the stakes?" },
      { name: "Consequence", description: "The choice brings consequences", prompt: "What results from their choice? How do they change?" },
      { name: "Resolution", description: "A new equilibrium is reached", prompt: "How has the character changed? What have they learned or achieved?" }
    ]
  }
];

export function getTemplatesByCategory(category: string): WritingTemplate[] {
  return GENRE_TEMPLATES.filter(t => t.category === category);
}

export function getCategories(): string[] {
  return [...new Set(GENRE_TEMPLATES.map(t => t.category))];
}

export function createTemplateFromGenre(genreId: string): WritingTemplate | undefined {
  const template = GENRE_TEMPLATES.find(t => t.id === genreId);
  if (!template) return undefined;
  
  return {
    ...template,
    id: uuidv4(),
    name: `${template.name} - Copy`,
    beats: template.beats.map(beat => ({ ...beat }))
  };
}

export function generateTemplateScene(
  template: WritingTemplate,
  beatIndex: number,
  projectTitle: string,
  characters: string[]
): string {
  const beat = template.beats[beatIndex];
  if (!beat) return "";
  
  let prompt = `# ${beat.name}\n\n`;
  prompt += `*${beat.description}*\n\n`;
  prompt += `## Writing Prompt\n${beat.prompt}\n\n`;
  prompt += `---\n\n`;
  prompt += `**Genre:** ${template.category}\n`;
  prompt += `**Template:** ${template.name}\n`;
  if (projectTitle) prompt += `\n**Project:** ${projectTitle}`;
  if (characters.length > 0) prompt += `\n**Characters:** ${characters.join(", ")}`;
  
  return prompt;
}
