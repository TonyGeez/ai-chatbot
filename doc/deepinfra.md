FLUX.2 is live! High-fidelity image generation made simple.

Documentation

OpenAI API

We offer OpenAI compatible API for all LLM models and all Embeddings models.

The APIs we support are:

    chat completion — both streaming and regular
    completion — both streaming and regular
    embeddings — supported for all embeddings models.

The endpoint for the OpenAI APIs is https://api.deepinfra.com/v1/openai.

You can do HTTP requests. You can also use the official Python and Node.js libraries. In all cases streaming is also supported.
Official libraries

For Python you should run

pip install openai
copy

For JavaScript/Node.js you should run

npm install openai
copy

Chat Completions

The Chat Completions API is the easiest to use. You exchange messages and it just works. You can change the model to another LLM and it will continue working.

from openai import OpenAI

openai = OpenAI(
    api_key="$DEEPINFRA_TOKEN",
    base_url="https://api.deepinfra.com/v1/openai",
)

stream = True # or False

chat_completion = openai.chat.completions.create(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    messages=[{"role": "user", "content": "Hello"}],
    stream=stream,
)

if stream:
    for event in chat_completion:
        if event.choices[0].finish_reason:
            print(event.choices[0].finish_reason,
                  event.usage['prompt_tokens'],
                  event.usage['completion_tokens'])
        else:
            print(event.choices[0].delta.content)
else:
    print(chat_completion.choices[0].message.content)
    print(chat_completion.usage.prompt_tokens, chat_completion.usage.completion_tokens)
copy

You can see more complete examples at the documentation page of each model.
Conversations with Chat Completions

To create a longer chat-like conversation you have to add each response message and each of the user's messages to every request. This way the model will have the context and will be able to provide better answers. You can tweak it even further by providing a system message.

from openai import OpenAI

openai = OpenAI(
    api_key="$DEEPINFRA_TOKEN",
    base_url="https://api.deepinfra.com/v1/openai",
)

stream = True # or False

chat_completion = openai.chat.completions.create(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    messages=[
        {"role": "system", "content": "Respond like a michelin starred chef."},
        {"role": "user", "content": "Can you name at least two different techniques to cook lamb?"},
        {"role": "assistant", "content": "Bonjour! Let me tell you, my friend, cooking lamb is an art form, and I'm more than happy to share with you not two, but three of my favorite techniques to coax out the rich, unctuous flavors and tender textures of this majestic protein. First, we have the classic \"Sous Vide\" method. Next, we have the ancient art of \"Sous le Sable\". And finally, we have the more modern technique of \"Hot Smoking.\""},
        {"role": "user", "content": "Tell me more about the second method."},
    ],
    stream=stream,
)

if stream:
    for event in chat_completion:
        if event.choices[0].finish_reason:
            print(event.choices[0].finish_reason,
                  event.usage['prompt_tokens'],
                  event.usage['completion_tokens'])
        else:
            print(event.choices[0].delta.content)
else:
    print(chat_completion.choices[0].message.content)
    print(chat_completion.usage.prompt_tokens, chat_completion.usage.completion_tokens)
copy

The longer the conversation gets, the more time it takes the model to generate the response. The number of messages that you can have in a conversation is limited by the context size of a model. Larger models also usually take more time to respond and are more expensive.
Completions

This is an advanced API. You should know how to format the input to make it work. Different models might have a different input format. The example below is for meta-llama/Meta-Llama-3-8B-Instruct. You can see the model's input format in the API section on its page.

from openai import OpenAI

openai = OpenAI(
    api_key="$DEEPINFRA_TOKEN",
    base_url="https://api.deepinfra.com/v1/openai",
)

stream = True # or False

completion = openai.completions.create(
    model='meta-llama/Meta-Llama-3-8B-Instruct',
    prompt='<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\nHello!<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
    stop=['<|eot_id|>'],
    stream=stream,
)

if stream:
    for event in completion:
        if event.choices[0].finish_reason:
            print(event.choices[0].finish_reason,
                  event.usage.prompt_tokens,
                  event.usage.completion_tokens)
        else:
            print(event.choices[0].text)
else:
    print(completion.choices[0].text)
    print(completion.usage.prompt_tokens, completion.usage.completion_tokens)
copy

For every model you can check its input format in the API section on its page.
Embeddings

DeepInfra supports the OpenAI embeddings API. The following creates an embedding vector representing the input text

from openai import OpenAI

openai = OpenAI(
    api_key="$DEEPINFRA_TOKEN",
    base_url="https://api.deepinfra.com/v1/openai",
)

input = "The food was delicious and the waiter...", # or an array ["hello", "world"]

embeddings = openai.embeddings.create(
  model="BAAI/bge-large-en-v1.5",
  input=input,
  encoding_format="float"
)

if isinstance(input, str):
    print(embeddings.data[0].embedding)
else:
    for i in range(len(input)):
        print(embeddings.data[i].embedding)

print(embeddings.usage.prompt_tokens)
copy

Image Generation

You can use the OpenAI compatible API to generate images. Here's an example using Python:

import io
import base64
from PIL import Image
from openai import OpenAI

client = OpenAI(
    api_key="$DEEPINFRA_TOKEN",
    base_url="https://api.deepinfra.com/v1/openai"
)

if __name__ == "__main__":
    response = client.images.generate(
        prompt="A photo of an astronaut riding a horse on Mars.",
        size="1024x1024",
        quality="standard",
        n=1,
    )
    b64_json = response.data[0].b64_json
    image_bytes = base64.b64decode(b64_json)
    image = Image.open(io.BytesIO(image_bytes))
    image.save("output.png")
copy

Model parameter

Some models have more than one version available, you can infer against a particular version by specifying {"model": "MODEL_NAME:VERSION", ...} format.

You could also infer against a deploy_id, by using {"model": "deploy_id:DEPLOY_ID", ...}. This is especially useful for Custom LLMs, you can infer before the deployment is running (and before you have the model-name+version pair).
Caveats

Please note that we might not be 100% compatible yet, let us know in discord or by email if something you require is missing. Supported request attributes:

ChatCompletions and Completions:

    model, including specifying version/deploy_id support
    messages (roles system, user, assistant)
    max_tokens
    stream
    temperature
    top_p
    stop
    n
    presence_penalty
    frequency_penalty
    response_format ({"type": "json"} only, it will return default format when omitted)
    tools, tool_choice
    echo, logprobs -- only for (non chat) completions

deploy_id might not be immediately avaiable if the model is currently deploying

Embeddings:

    model
    input
    encoding_format -- float only

Images:

    model -- Defaults to FLUX Schnell
    quality and style -- only available for compatibility.
    response_format -- only b64_json supported for now.

You can see even more details on each model's page.
Footer Logo
SOC 2 CertifiedISO 27001 Certified

Have questions or need a custom solution?

Company
Pricing
Docs
Compare
DeepStart
About
Careers
Contact us
Trust Center
DeepGPT

Latest Models
anthropic/claude-3-7-sonnet-latest
moonshotai/Kimi-K2-Instruct-0905
deepseek-ai/DeepSeek-V3.2-Exp
zai-org/GLM-4.6
deepseek-ai/DeepSeek-V3.1

Featured Models
Qwen/Qwen3-235B-A22B-Thinking-2507
mistralai/Mistral-Small-3.2-24B-Instruct-2506
deepseek-ai/DeepSeek-V3.1-Terminus
google/gemini-2.5-flash
Qwen/Qwen3-Next-80B-A3B-Instruct
Built With Love in Palo Alto

© 2025 Deep Infra. All rights reserved.
Privacy Policy
Terms of Service

Use OpenAI API clients with LLaMas | ML Models | DeepInfra