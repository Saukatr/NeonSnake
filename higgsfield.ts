import * as dotenv from 'dotenv';
import { HiggsfieldClient } from '@higgsfield/client';

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
    // Initialize Higgsfield client with credentials
    const hf = new HiggsfieldClient({
      apiKey: credentials,
    });

    console.log('Starting video generation with Seedance 2.5...');
    console.log('Parameters:');
    console.log('  - Endpoint: bytedance/seedance-2.5/text-to-video');
    console.log('  - Prompt: A cinematic scene at sunset');
    console.log('  - Duration: 5 seconds');
    console.log('  - Resolution: 720p');
    console.log('  - Aspect Ratio: 16:9');
    console.log('');

    // Generate video using Higgsfield API
    const jobSet = await hf.generate(
      'bytedance/seedance-2.5/text-to-video',
      {
        prompt: 'A cinematic scene at sunset',
        duration: 5,
        resolution: '720p',
        aspect_ratio: '16:9',
      },
      { withPolling: true } // Enable polling to wait for completion
    );

    console.log(`Request ID: ${jobSet.id}`);
    console.log('Generation completed!');
    console.log('');

    // Check the result status
    if (jobSet.isCompleted) {
      console.log('✓ Generation succeeded!');
      if (jobSet.jobs && jobSet.jobs.length > 0) {
        const job = jobSet.jobs[0];
        console.log(`\nJob Details:`);
        console.log(`  - Status: ${job.status}`);
        if (job.results && job.results.raw) {
          console.log(`\nGenerated Video URL:\n${job.results.raw.url}`);
        }
      }
    } else if (jobSet.isFailed) {
      console.error('✗ Generation failed');
      process.exit(1);
    } else if (jobSet.isCanceled) {
      console.error('✗ Generation was canceled');
      process.exit(1);
    } else if (jobSet.isNsfw) {
      console.error('✗ Generation was rejected (content moderation)');
      process.exit(1);
    }

    hf.close();
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
