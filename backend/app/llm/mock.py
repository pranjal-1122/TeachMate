import json
import logging
from typing import Type, TypeVar, Optional, Tuple, Dict, Any
from pydantic import BaseModel
from app.llm.base import BaseLLMClient, LLMUsage, T

logger = logging.getLogger(__name__)

class MockLLMClient(BaseLLMClient):
    """Deterministic mock client for offline runs, demo reliability, and automated testing."""

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[T, LLMUsage]:
        schema_name = response_schema.__name__
        prompt_lower = prompt.lower()

        usage = LLMUsage(
            input_tokens=150,
            output_tokens=350,
            total_tokens=500,
            latency_ms=85,
            model="mock-teachmate-v1"
        )

        # 1. Assessment Generation
        if schema_name == "AssessmentResponse" or "AssessmentResponse" in schema_name:
            mock_data = {
                "questions": [
                    {
                        "position": 1,
                        "question": "What is the core physical principle underlying this topic, and how does it apply when no external forces act?",
                        "concept": "Fundamental Principles & Equilibrium",
                        "difficulty": "easy",
                        "type": "conceptual",
                        "format": "mcq",
                        "options": [
                            {"id": "A", "text": "An object maintains its state of rest or uniform motion unless acted upon by a net external force."},
                            {"id": "B", "text": "An object immediately slows down to zero velocity when net force is absent."},
                            {"id": "C", "text": "Continuous positive force is required to sustain steady constant velocity."},
                            {"id": "D", "text": "Inertia continuously increases proportionally as velocity increases."}
                        ],
                        "rubric_criteria": "Teacher accurately selects Option A and explains the baseline concept without confusing force with velocity.",
                        "reference_explanation": "Option A is correct: Newton's first law states an object maintains uniform motion unless an unbalanced force acts."
                    },
                    {
                        "position": 2,
                        "question": "When a vehicle decelerates abruptly, why do standing passengers stumble forward? Explain the mechanism.",
                        "concept": "Inertia and Reference Frames",
                        "difficulty": "medium",
                        "type": "application",
                        "format": "theoretical",
                        "options": None,
                        "rubric_criteria": "Must reference inertia of motion; resistance to change in velocity; forces on passenger feet vs torso.",
                        "reference_explanation": "The passenger's body continues moving forward at the previous velocity due to inertia while the bus decelerates."
                    },
                    {
                        "position": 3,
                        "question": "How do mass and net applied force mathematically determine acceleration? Provide a classroom example with numerical values.",
                        "concept": "Force-Mass-Acceleration Dynamics",
                        "difficulty": "medium",
                        "type": "application",
                        "format": "theoretical",
                        "options": None,
                        "rubric_criteria": "Must cite F = ma correctly, units (N, kg, m/s^2), and inverse proportionality of mass to acceleration.",
                        "reference_explanation": "Acceleration is directly proportional to net force and inversely proportional to mass: a = F/m."
                    },
                    {
                        "position": 4,
                        "question": "Which statement best diagnoses and corrects the student misconception that 'heavier objects always fall faster in vacuum'?",
                        "concept": "Gravitational Mass vs Inertial Mass",
                        "difficulty": "hard",
                        "type": "misconception",
                        "format": "mcq",
                        "options": [
                            {"id": "A", "text": "Greater gravitational pull on larger mass is exactly balanced by greater inertia, yielding identical acceleration g = F/m."},
                            {"id": "B", "text": "Heavier objects encounter zero vacuum resistance while lighter objects encounter lingering quantum friction."},
                            {"id": "C", "text": "Gravity does not apply to heavy masses in vacuum environments."},
                            {"id": "D", "text": "Only light objects experience terminal velocity in free vacuum conditions."}
                        ],
                        "rubric_criteria": "Teacher selects Option A, distinguishing weight from acceleration showing mass cancels out.",
                        "reference_explanation": "Option A is correct: The gravitational force is proportional to mass (F=mg), but acceleration is a=F/m=g, so mass cancels."
                    },
                    {
                        "position": 5,
                        "question": "If an astronaut throws a ball in deep interstellar space, what force keeps the ball traveling? Explain how you clarify this to students.",
                        "concept": "Motion Without Continuous Force",
                        "difficulty": "hard",
                        "type": "conceptual",
                        "format": "theoretical",
                        "options": None,
                        "rubric_criteria": "Clarifies that no force is required to sustain motion; inertia is a property, not a force.",
                        "reference_explanation": "No forward force exists once released; by inertia the ball continues at constant velocity."
                    }
                ]
            }
            return response_schema.model_validate(mock_data), usage

        # 2. Answer Analysis
        if schema_name == "KnowledgeAnalysisResponse":
            # Check answer quality: if answers contain explicit low-readiness indicators
            low_indicators = ["idk", "don't know", "dont know", "skip_question", "weak_answer", "test_low_score", "unsure about this"]
            is_low_quality = any(phrase in prompt_lower for phrase in low_indicators)
            
            if is_low_quality:
                mock_data = {
                    "score": 58.0,
                    "strengths": [
                        "Identified basic qualitative definitions",
                        "Recognized general role of inertia"
                    ],
                    "knowledge_gaps": [
                        {
                            "concept": "Quantitative Force-Mass-Acceleration Coupling",
                            "severity": "moderate",
                            "explanation": "Answer missed connecting net external force quantitatively with rate of change of momentum (F=ma)."
                        },
                        {
                            "concept": "Continuous Force Misconception",
                            "severity": "significant",
                            "explanation": "Improperly suggested continuous force is needed to sustain constant velocity in space."
                        }
                    ],
                    "per_question_feedback": [
                        {"question_position": 1, "score": 80.0, "feedback": "Solid basic explanation.", "evidence": "Mentioned state of rest."},
                        {"question_position": 2, "score": 70.0, "feedback": "Understood inertia intuitively but lacked precision.", "evidence": "Noted body continues moving."},
                        {"question_position": 3, "score": 50.0, "feedback": "Did not demonstrate mathematical relationship or units.", "evidence": "Omitted F=ma calculation."},
                        {"question_position": 4, "score": 50.0, "feedback": "Struggled to articulate why mass cancels in acceleration.", "evidence": "Gave brief qualitative answer."},
                        {"question_position": 5, "score": 40.0, "feedback": "Preserved the common misconception of sustained force.", "evidence": "Suggested residual energy acts as force."}
                    ]
                }
            else:
                mock_data = {
                    "score": 86.0,
                    "strengths": [
                        "Precise conceptual differentiation between inertia and applied force",
                        "Correct mathematical articulation of F = ma with units",
                        "Clear pedagogical approach for resolving gravitational misconceptions"
                    ],
                    "knowledge_gaps": [
                        {
                            "concept": "Non-inertial Reference Frames",
                            "severity": "minor",
                            "explanation": "Could provide deeper clarity on fictitious vs real forces in accelerating frames."
                        }
                    ],
                    "per_question_feedback": [
                        {"question_position": 1, "score": 90.0, "feedback": "Clear, comprehensive conceptual foundation.", "evidence": "Excellently defined equilibrium."},
                        {"question_position": 2, "score": 85.0, "feedback": "Accurate application of inertia of motion.", "evidence": "Explained passenger momentum."},
                        {"question_position": 3, "score": 90.0, "feedback": "Precise formulation of second law.", "evidence": "Calculated F=ma accurately."},
                        {"question_position": 4, "score": 80.0, "feedback": "Clear explanation of mass cancellation in freefall.", "evidence": "Derived a=g."},
                        {"question_position": 5, "score": 85.0, "feedback": "Properly refuted continuous force requirement.", "evidence": "Highlighted constant velocity in vacuum."}
                    ]
                }
            return response_schema.model_validate(mock_data), usage

        # 3. Revision Generation
        if schema_name == "RevisionResponse":
            mock_data = {
                "round_number": 1,
                "content_markdown": """# Targeted Concept Revision

### 1. Force vs. Velocity: The Core Distinction
A common misconception is that motion requires a continuous force. In reality:
- **Net Force = 0** $\\implies$ **Velocity is Constant** (no change in speed or direction).
- Forces do **not** create velocity; net forces produce **acceleration** (rate of change of velocity).

### 2. Deconstructing Newton's Second Law ($F = ma$)
- **$F_{net}$ (Newtons)** = Total unbalanced vector force.
- **$m$ (kg)** = Inertial mass (resistance to acceleration).
- **$a$ ($m/s^2$)** = Acceleration ($a = \\frac{F_{net}}{m}$).

*Classroom Rule of Thumb:* If mass doubles and force remains constant, acceleration is halved!
""",
                "quick_check_questions": [
                    {
                        "id": "qc-1",
                        "prompt": "If a space probe is traveling through interstellar vacuum at 20,000 km/h with its thrusters turned off, what is the net external force acting on it?",
                        "concept": "Constant Velocity Dynamics"
                    },
                    {
                        "id": "qc-2",
                        "prompt": "A 1,000 kg car accelerates at 3 m/s^2. If 1,000 kg of cargo is loaded and engine thrust stays identical, what is the new acceleration?",
                        "concept": "Inverse Proportionality of Mass"
                    }
                ]
            }
            return response_schema.model_validate(mock_data), usage

        # 4. Lesson Generation
        if schema_name == "LessonResponse":
            mock_data = {
                "title": "Mastering Newton's Laws: Real-World Dynamics & Misconception Busting",
                "objectives": [
                    "Distinguish between balanced forces (equilibrium) and unbalanced forces causing acceleration.",
                    "Apply F = ma to calculate force, mass, or acceleration in daily transportation scenarios.",
                    "Debunk common student misconceptions regarding falling objects and sustained motion in space."
                ],
                "sections": [
                    {
                        "heading": "1. The Hook: The Mystery of the Standing Commuter",
                        "content": "Begin the class by asking: 'Have you ever stood on a braking subway train and wondered what invisible hand pushed you forward?' This introduces inertia not as an abstract definition, but as a bodily experience."
                    },
                    {
                        "heading": "2. Storytelling: Galileo, Newton, and the Leaning Tower",
                        "content": "Share the historical breakthrough of Galileo and Newton challenging Aristotelian belief that objects stop because they 'get tired'. Newton formalized that friction and air resistance are actual external forces."
                    },
                    {
                        "heading": "3. Conceptual Deep Dive: Inertia vs Acceleration",
                        "content": "Mass is inertia made tangible. A loaded freight train requires miles of track to decelerate because its enormous mass resists change in velocity."
                    },
                    {
                        "heading": "4. Mathematical Practice: The F = ma Triangle",
                        "content": "Demonstrate that acceleration is the dependent variable. Show students how doubling mass cuts acceleration in half unless engine force is doubled."
                    }
                ],
                "visual_specs": [
                    {
                        "type": "mermaid",
                        "title": "Force and Acceleration Flow",
                        "spec": 'graph TD\n  A["Net External Force"] -->|Non-Zero| B["Unbalanced System"]\n  B --> C["Acceleration a = F/m"]\n  A -->|Zero Net Force| D["Balanced Equilibrium"]\n  D --> E["Constant Velocity / Rest"]'
                    }
                ],
                "activities": [
                    {
                        "title": "Index Card Coin Drop Challenge",
                        "duration_minutes": 10,
                        "instructions": "Place an index card over a drinking glass with a heavy coin on top. Rapidly flick the card horizontally. The coin drops straight into the glass due to inertia!"
                    },
                    {
                        "title": "Skateboard Inertia Demonstration",
                        "duration_minutes": 15,
                        "instructions": "Have a student stand gently on a skateboard. When the skateboard is pulled abruptly, observe the student's center of mass remain stationary."
                    }
                ],
                "summary": "Newton's Laws explain how and why objects move. Understanding that forces cause acceleration—not motion itself—is the single most transformative takeaway for introductory physics students."
            }
            return response_schema.model_validate(mock_data), usage

        # 5. Quiz Generation
        if schema_name == "QuizResponse":
            mock_data = {
                "title": "Classroom Quiz: Newton's Laws and Motion Concepts",
                "questions": [
                    {
                        "position": 1,
                        "question_text": "A passenger in a car lurches forward when the brakes are suddenly slammed. Which law explains this phenomenon?",
                        "options": [
                            {"id": "a", "text": "Newton's First Law (Law of Inertia)"},
                            {"id": "b", "text": "Newton's Second Law (F = ma)"},
                            {"id": "c", "text": "Newton's Third Law (Action-Reaction)"},
                            {"id": "d", "text": "Law of Conservation of Energy"}
                        ],
                        "correct_option_id": "a",
                        "explanation": "The passenger's body tends to continue moving forward with the vehicle's initial velocity due to inertia."
                    },
                    {
                        "position": 2,
                        "question_text": "If a net force of 40 N is applied to an object with a mass of 8 kg, what is its resulting acceleration?",
                        "options": [
                            {"id": "a", "text": "320 m/s²"},
                            {"id": "b", "text": "5 m/s²"},
                            {"id": "c", "text": "0.2 m/s²"},
                            {"id": "d", "text": "48 m/s²"}
                        ],
                        "correct_option_id": "b",
                        "explanation": "Using a = F / m: 40 N / 8 kg = 5 m/s²."
                    },
                    {
                        "position": 3,
                        "question_text": "In a vacuum chamber, a bowling ball and a feather are dropped simultaneously from equal height. What occurs?",
                        "options": [
                            {"id": "a", "text": "The bowling ball lands first because it has greater weight."},
                            {"id": "b", "text": "Both hit the ground at exactly the same time."},
                            {"id": "c", "text": "The feather lands first due to less gravitational attraction."},
                            {"id": "d", "text": "Neither falls because there is no air."}
                        ],
                        "correct_option_id": "b",
                        "explanation": "In a vacuum with no air resistance, all objects accelerate at the identical rate of gravity g."
                    },
                    {
                        "position": 4,
                        "question_text": "A hockey puck slides across frictionless ice at 10 m/s. What net force is required to keep it moving at this speed?",
                        "options": [
                            {"id": "a", "text": "0 N"},
                            {"id": "b", "text": "10 N"},
                            {"id": "c", "text": "Equal to the puck's weight"},
                            {"id": "d", "text": "Cannot be determined without friction"}
                        ],
                        "correct_option_id": "a",
                        "explanation": "According to Newton's First Law, no net force is required to maintain constant velocity."
                    },
                    {
                        "position": 5,
                        "question_text": "When an engine applies constant forward force to a rocket that is steadily burning and expelling mass, what happens to the rocket's acceleration?",
                        "options": [
                            {"id": "a", "text": "Acceleration decreases"},
                            {"id": "b", "text": "Acceleration stays constant"},
                            {"id": "c", "text": "Acceleration increases"},
                            {"id": "d", "text": "Acceleration drops to zero"}
                        ],
                        "correct_option_id": "c",
                        "explanation": "Since a = F / m and mass m decreases while force F is constant, acceleration a must increase."
                    }
                ]
            }
            return response_schema.model_validate(mock_data), usage

        # Default fallback
        logger.warning(f"Mock client fallback for schema: {schema_name}")
        return response_schema.model_validate({}), usage
