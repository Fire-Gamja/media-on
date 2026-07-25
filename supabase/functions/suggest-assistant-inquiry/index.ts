declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const categories = ['academic', 'equipment', 'room', 'facility', 'other'] as const;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!request.headers.get('Authorization')) {
      return json({ error: '로그인이 필요합니다.' }, 401);
    }

    const { content } = await request.json();
    if (typeof content !== 'string' || content.trim().length < 10 || content.length > 5000) {
      return json({ error: '문의 내용은 10자 이상 5000자 이하로 입력해 주세요.' }, 400);
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY secret is missing.');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.6-sol',
        reasoning: { effort: 'none' },
        instructions: [
          '서원대학교 미디어콘텐츠학부 조교 문의를 분류하고 짧은 한국어 제목을 만든다.',
          'academic: 수강, 학사, 졸업, 공결, 휴복학, 학적 등.',
          'equipment: 카메라, 노트북, 짐벌 등 기자재 대여.',
          'room: 실습실 대여 및 ERP 신청 확인.',
          'facility: 에어컨, 의자, 출입문, 인터넷 등 시설 고장과 환경.',
          'other: 위 유형에 해당하지 않는 문의.',
          '제목은 사실을 추가하지 말고 공백 포함 30자 이내로 작성한다.',
        ].join('\n'),
        input: content.trim(),
        text: {
          format: {
            type: 'json_schema',
            name: 'assistant_inquiry_suggestion',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: categories },
                title: { type: 'string', minLength: 1, maxLength: 30 },
              },
              required: ['category', 'title'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI request failed', response.status, await response.text());
      return json({ error: 'AI 추천을 생성하지 못했습니다.' }, 502);
    }

    const result = await response.json();
    const outputText = result.output
      ?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
      .find((item: { type?: string }) => item.type === 'output_text')?.text;
    if (!outputText) {
      return json({ error: 'AI 추천 결과가 비어 있습니다.' }, 502);
    }

    const suggestion = JSON.parse(outputText);
    if (!categories.includes(suggestion.category) || typeof suggestion.title !== 'string') {
      return json({ error: 'AI 추천 결과 형식이 올바르지 않습니다.' }, 502);
    }

    return json({ category: suggestion.category, title: suggestion.title.trim() });
  } catch (error) {
    console.error(error);
    return json({ error: 'AI 추천 처리 중 오류가 발생했습니다.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
