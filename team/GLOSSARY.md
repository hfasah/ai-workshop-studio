# Glossary — fixed definitions the writers must use

Never expand or define these terms differently. If a term is not here and you are not certain, do not expand it; describe what it does instead.

- **MCP**: Model Context Protocol. An open standard that lets an AI assistant connect to tools and data sources (files, databases, apps) through a common interface, so one connector works across assistants.
- **API**: Application Programming Interface. A defined way for one program to ask another program for data or actions, for example a CRM's API returning a customer record.
- **AI agent**: software that works toward a goal by reasoning, using tools, remembering context and taking actions within permissions.
- **Chatbot**: answers messages in conversation; does not take actions on its own.
- **LLM**: large language model. Predicts the next token from patterns learned in training.
- **Token**: a small piece of text (a word, part of a word or a character) the model reads and writes.
- **Context window**: everything the model can see in one request, its working memory. Not the training data.
- **Prompt**: the text you send to the model.
- **Context engineering**: choosing and arranging what goes into the context window (instructions, documents, examples, tool results) so the model has what it needs.
- **RAG**: retrieval-augmented generation. Fetch relevant documents from a knowledge base and put them into the context before the model answers.
- **Hallucination**: a fluent answer that is wrong. Training rewards a confident guess over saying "I don't know".
- **Tool use / function calling**: the model emits a structured request; the application runs the tool and returns the result into the context.
- **Fine-tuning**: further training a model on examples to change its behaviour.
- **Embedding**: a list of numbers representing the meaning of text, used to find similar text.
- **Guardrail**: a rule enforced outside the model (permissions, validation, approval) that limits what the AI can do.
- **Human in the loop**: a person approves or checks the AI's work before it takes effect.
- **Evaluation (evals)**: repeatable tests that measure whether an AI system does what it should.
- **Webhook**: an automatic message one system sends to another when something happens.
- **Automation workflow (n8n, Zapier, Make)**: a chain of steps that run when a trigger happens, which may call an AI model as one step.
