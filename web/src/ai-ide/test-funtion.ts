import { inject, injectable } from 'inversify';

import { ToolInvocationContext, ToolProvider, ToolRequest } from '@MagicIdea/ai-core';
import { GET_CURRENT_TIME_ID } from './common/test-functions';

@injectable()
export class TestSystemFunction implements ToolProvider {

  static ID = GET_CURRENT_TIME_ID

  getTool(): ToolRequest {
    return {
      id: TestSystemFunction.ID,
      name: TestSystemFunction.ID,
      description: 'Get the current time in a specific timezone. If no timezone is provided, returns UTC time.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The timezone to get the time for (e.g., "America/New_York", "Europe/London"). If not provided, returns UTC time.'
          }
        },
        required: ['name']
      },
      handler: async (_: string) => {
        const args = JSON.parse(_);
        const timezone = args.name || 'UTC';
        try {
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
          };
          const timeString = now.toLocaleString('en-US', options);
          return { current_time: timeString };
        } catch (error) {
          return { error: `Invalid timezone: ${timezone}` };
        }
      }
    }
  }

}