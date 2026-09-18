import * as dotenv from 'dotenv';
import { HiggsField } from '@higgsfield/client';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function generateVideoWithSeedance25() {
  // Get credentials from environment
  const credentials = process.env.HF_CREDENTIALS;

  if (!credentials) {
    console.error('Error: HF_CREDENTIALS not set in .env.local');
    console.error('Please add your Higgsfield API credentials in key-id:key-secret format');
    process.exit(1);
  }

  try {
    // Initialize Higgsfield client
    const hf = new HiggsField({
      apiKey: credentials,
    });

    console.log('Starting video generation with Seedance 2.5...');
    console.log('Parameters:');
    console.log('  - Model: bytedance/seedance-2.5/text-to-video');
    console.log('  - Prompt: A cinematic scene at sunset');
    console.log('  - Duration: 5 seconds');
    console.log('  - Resolution: 720p');
    console.log('  - Aspect Ratio: 16:9');
    console.log('');

    // Subscribe to generation request
    const generation = await hf.subscribe({
      model: 'bytedance/seedance-2.5/text-to-video',
      input: {
        prompt: 'A cinematic scene at sunset',
        duration: 5,
        resolution: '720p',
        aspect_ratio: '16:9',
      },
    });

    console.log(`Request ID: ${generation.requestId}`);
    console.log('Waiting for generation to complete...');
    console.log('');

    // Poll for completion
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes with 5-second intervals

    while (!isComplete && attempts < maxAttempts) {
      const status = await generation.status();

      console.log(`[Attempt ${attempts + 1}/${maxAttempts}] Status: ${status.status}`);

      if (status.status === 'succeeded') {
        console.log('✓ Generation succeeded!');
        if (status.output && status.output.video_url) {
          console.log(`\nGenerated Video URL:\n${status.output.video_url}`);
        }
        isComplete = true;
      } else if (status.status === 'failed') {
        console.error('✗ Generation failed');
        if (status.error) {
          console.error(`Error details: ${JSON.stringify(status.error)}`);
        }
        process.exit(1);
      } else if (status.status === 'canceled') {
        console.error('✗ Generation was canceled');
        process.exit(1);
      } else if (status.status === 'moderated') {
        console.error('✗ Generation was rejected (content moderation)');
        process.exit(1);
      }

      if (!isComplete) {
        // Wait 5 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    if (!isComplete) {
      console.error('✗ Generation timed out after 10 minutes');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during generation:');
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the example
generateVideoWithSeedance25();
