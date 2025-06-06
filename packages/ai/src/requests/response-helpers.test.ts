/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  addHelpers,
  formatBlockErrorMessage,
  handlePredictResponse
} from './response-helpers';
import { expect, use } from 'chai';
import { restore } from 'sinon';
import sinonChai from 'sinon-chai';
import {
  BlockReason,
  Content,
  FinishReason,
  GenerateContentResponse,
  ImagenGCSImage,
  InlineDataPart,
  ImagenInlineImage
} from '../types';
import { getMockResponse } from '../../test-utils/mock-response';

use(sinonChai);

const fakeResponseText: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [{ text: 'Some text' }, { text: ' and some more text' }]
      }
    }
  ]
};

const functionCallPart1 = {
  functionCall: {
    name: 'find_theaters',
    args: {
      location: 'Mountain View, CA',
      movie: 'Barbie'
    }
  }
};

const functionCallPart2 = {
  functionCall: {
    name: 'find_times',
    args: {
      location: 'Mountain View, CA',
      movie: 'Barbie',
      time: '20:00'
    }
  }
};

const fakeResponseFunctionCall: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [functionCallPart1]
      }
    }
  ]
};

const fakeResponseFunctionCalls: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [functionCallPart1, functionCallPart2]
      }
    }
  ]
};

const fakeResponseMixed1: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [{ text: 'some text' }, functionCallPart2]
      }
    }
  ]
};

const fakeResponseMixed2: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [functionCallPart1, { text: 'some text' }]
      }
    }
  ]
};

const fakeResponseMixed3: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [
          { text: 'some text' },
          functionCallPart1,
          { text: ' and more text' }
        ]
      }
    }
  ]
};

const inlineDataPart1: InlineDataPart = {
  inlineData: {
    mimeType: 'image/png',
    data: 'base64encoded...'
  }
};

const inlineDataPart2: InlineDataPart = {
  inlineData: {
    mimeType: 'image/jpeg',
    data: 'anotherbase64...'
  }
};

const fakeResponseInlineData: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [inlineDataPart1, inlineDataPart2]
      }
    }
  ]
};

const fakeResponseTextAndInlineData: GenerateContentResponse = {
  candidates: [
    {
      index: 0,
      content: {
        role: 'model',
        parts: [{ text: 'Describe this:' }, inlineDataPart1]
      }
    }
  ]
};

const badFakeResponse: GenerateContentResponse = {
  promptFeedback: {
    blockReason: BlockReason.SAFETY,
    safetyRatings: []
  }
};

describe('response-helpers methods', () => {
  afterEach(() => {
    restore();
  });
  describe('addHelpers', () => {
    it('good response text', async () => {
      const enhancedResponse = addHelpers(fakeResponseText);
      expect(enhancedResponse.text()).to.equal('Some text and some more text');
      expect(enhancedResponse.functionCalls()).to.be.undefined;
      expect(enhancedResponse.inlineDataParts()).to.be.undefined;
    });
    it('good response functionCall', async () => {
      const enhancedResponse = addHelpers(fakeResponseFunctionCall);
      expect(enhancedResponse.text()).to.equal('');
      expect(enhancedResponse.functionCalls()).to.deep.equal([
        functionCallPart1.functionCall
      ]);
      expect(enhancedResponse.inlineDataParts()).to.be.undefined;
    });
    it('good response functionCalls', async () => {
      const enhancedResponse = addHelpers(fakeResponseFunctionCalls);
      expect(enhancedResponse.text()).to.equal('');
      expect(enhancedResponse.functionCalls()).to.deep.equal([
        functionCallPart1.functionCall,
        functionCallPart2.functionCall
      ]);
      expect(enhancedResponse.inlineDataParts()).to.be.undefined;
    });
    it('good response text/functionCall', async () => {
      const enhancedResponse = addHelpers(fakeResponseMixed1);
      expect(enhancedResponse.functionCalls()).to.deep.equal([
        functionCallPart2.functionCall
      ]);
      expect(enhancedResponse.text()).to.equal('some text');
      expect(enhancedResponse.inlineDataParts()).to.be.undefined;
    });
    it('good response functionCall/text', async () => {
      const enhancedResponse = addHelpers(fakeResponseMixed2);
      expect(enhancedResponse.functionCalls()).to.deep.equal([
        functionCallPart1.functionCall
      ]);
      expect(enhancedResponse.text()).to.equal('some text');
      expect(enhancedResponse.inlineDataParts()).to.be.undefined;
    });
    it('good response text/functionCall/text', async () => {
      const enhancedResponse = addHelpers(fakeResponseMixed3);
      expect(enhancedResponse.functionCalls()).to.deep.equal([
        functionCallPart1.functionCall
      ]);
      expect(enhancedResponse.text()).to.equal('some text and more text');
      expect(enhancedResponse.inlineDataParts()).to.be.undefined;
    });
    it('bad response safety', async () => {
      const enhancedResponse = addHelpers(badFakeResponse);
      expect(enhancedResponse.text).to.throw('SAFETY');
      expect(enhancedResponse.functionCalls).to.throw('SAFETY');
      expect(enhancedResponse.inlineDataParts).to.throw('SAFETY');
    });
    it('good response inlineData', async () => {
      const enhancedResponse = addHelpers(fakeResponseInlineData);
      expect(enhancedResponse.text()).to.equal('');
      expect(enhancedResponse.functionCalls()).to.be.undefined;
      expect(enhancedResponse.inlineDataParts()).to.deep.equal([
        inlineDataPart1,
        inlineDataPart2
      ]);
    });
    it('good response text/inlineData', async () => {
      const enhancedResponse = addHelpers(fakeResponseTextAndInlineData);
      expect(enhancedResponse.text()).to.equal('Describe this:');
      expect(enhancedResponse.functionCalls()).to.be.undefined;
      expect(enhancedResponse.inlineDataParts()).to.deep.equal([
        inlineDataPart1
      ]);
    });
  });
  describe('getBlockString', () => {
    it('has no promptFeedback or bad finishReason', async () => {
      const message = formatBlockErrorMessage({
        candidates: [
          {
            index: 0,
            finishReason: FinishReason.STOP,
            finishMessage: 'this was fine',
            content: {} as Content
          }
        ]
      });
      expect(message).to.equal('');
    });
    it('has promptFeedback and blockReason only', async () => {
      const message = formatBlockErrorMessage({
        promptFeedback: {
          blockReason: BlockReason.SAFETY,
          safetyRatings: []
        }
      });
      expect(message).to.include('Response was blocked due to SAFETY');
    });
    it('has promptFeedback with blockReason and blockMessage', async () => {
      const message = formatBlockErrorMessage({
        promptFeedback: {
          blockReason: BlockReason.SAFETY,
          blockReasonMessage: 'safety reasons',
          safetyRatings: []
        }
      });
      expect(message).to.include(
        'Response was blocked due to SAFETY: safety reasons'
      );
    });
    it('has bad finishReason only', async () => {
      const message = formatBlockErrorMessage({
        candidates: [
          {
            index: 0,
            finishReason: FinishReason.SAFETY,
            content: {} as Content
          }
        ]
      });
      expect(message).to.include('Candidate was blocked due to SAFETY');
    });
    it('has finishReason and finishMessage', async () => {
      const message = formatBlockErrorMessage({
        candidates: [
          {
            index: 0,
            finishReason: FinishReason.SAFETY,
            finishMessage: 'unsafe candidate',
            content: {} as Content
          }
        ]
      });
      expect(message).to.include(
        'Candidate was blocked due to SAFETY: unsafe candidate'
      );
    });
  });

  describe('handlePredictResponse', () => {
    it('returns base64 images', async () => {
      const mockResponse = getMockResponse(
        'vertexAI',
        'unary-success-generate-images-base64.json'
      ) as Response;
      const res = await handlePredictResponse<ImagenInlineImage>(mockResponse);
      expect(res.filteredReason).to.be.undefined;
      expect(res.images.length).to.equal(4);
      res.images.forEach(image => {
        expect(image.mimeType).to.equal('image/png');
        expect(image.bytesBase64Encoded.length).to.be.greaterThan(0);
      });
    });
  });
  it('returns GCS images', async () => {
    const mockResponse = getMockResponse(
      'vertexAI',
      'unary-success-generate-images-gcs.json'
    ) as Response;
    const res = await handlePredictResponse<ImagenGCSImage>(mockResponse);
    expect(res.filteredReason).to.be.undefined;
    expect(res.images.length).to.equal(4);
    res.images.forEach((image, i) => {
      expect(image.mimeType).to.equal('image/jpeg');
      expect(image.gcsURI).to.equal(
        `gs://test-project-id-1234.firebasestorage.app/images/1234567890123/sample_${i}.jpg`
      );
    });
  });
  it('has filtered reason and no images if all images were filtered', async () => {
    const mockResponse = getMockResponse(
      'vertexAI',
      'unary-failure-generate-images-all-filtered.json'
    ) as Response;
    const res = await handlePredictResponse<ImagenInlineImage>(mockResponse);
    expect(res.filteredReason).to.equal(
      "Unable to show generated images. All images were filtered out because they violated Vertex AI's usage guidelines. You will not be charged for blocked images. Try rephrasing the prompt. If you think this was an error, send feedback. Support codes: 39322892, 29310472"
    );
    expect(res.images.length).to.equal(0);
  });
  it('has filtered reason and no images if all base64 images were filtered', async () => {
    const mockResponse = getMockResponse(
      'vertexAI',
      'unary-failure-generate-images-base64-some-filtered.json'
    ) as Response;
    const res = await handlePredictResponse<ImagenInlineImage>(mockResponse);
    expect(res.filteredReason).to.equal(
      'Your current safety filter threshold filtered out 2 generated images. You will not be charged for blocked images. Try rephrasing the prompt. If you think this was an error, send feedback.'
    );
    expect(res.images.length).to.equal(2);
    res.images.forEach(image => {
      expect(image.mimeType).to.equal('image/png');
      expect(image.bytesBase64Encoded).to.have.length.greaterThan(0);
    });
  });
  it('has filtered reason and no images if all GCS images were filtered', async () => {
    const mockResponse = getMockResponse(
      'vertexAI',
      'unary-failure-generate-images-gcs-some-filtered.json'
    ) as Response;
    const res = await handlePredictResponse<ImagenGCSImage>(mockResponse);
    expect(res.filteredReason).to.equal(
      'Your current safety filter threshold filtered out 2 generated images. You will not be charged for blocked images. Try rephrasing the prompt. If you think this was an error, send feedback.'
    );
    expect(res.images.length).to.equal(2);
    res.images.forEach(image => {
      expect(image.mimeType).to.equal('image/jpeg');
      expect(image.gcsURI).to.have.length.greaterThan(0);
    });
  });
});
