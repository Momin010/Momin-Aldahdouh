export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { accessToken, projectName, files, userEmail, projectId } = req.body;

    if (!accessToken || !projectName || !files) {
      return res.status(400).json({
        message: 'Missing required fields: accessToken, projectName, files'
      });
    }

    // Create deployment on Vercel
    const deploymentData = {
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: Object.entries(files).map(([filePath, content]) => ({
        file: filePath,
        data: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      })),
      projectSettings: {
        framework: null, // Let Vercel auto-detect
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        installCommand: 'npm install',
        devCommand: 'npm run dev'
      }
    };

    // First, check if project exists, if not create it
    let projectId_vercel: string;

    try {
      // Try to get existing project
      const existingProjectResponse = await fetch(`https://api.vercel.com/v2/projects/${deploymentData.name}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (existingProjectResponse.ok) {
        const existingProject = await existingProjectResponse.json();
        projectId_vercel = existingProject.id;
      } else {
        // Create new project
        const createProjectResponse = await fetch('https://api.vercel.com/v2/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: deploymentData.name,
            framework: null,
          }),
        });

        if (!createProjectResponse.ok) {
          throw new Error('Failed to create Vercel project');
        }

        const newProject = await createProjectResponse.json();
        projectId_vercel = newProject.id;
      }

      // Create deployment
      const deployResponse = await fetch('https://api.vercel.com/v2/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: deploymentData.name,
          files: deploymentData.files,
          project: projectId_vercel,
          target: 'production'
        }),
      });

      if (!deployResponse.ok) {
        const errorData = await deployResponse.json();
        throw new Error(`Deployment failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const deployment = await deployResponse.json();

      // Store deployment info in our database
      if (userEmail && projectId) {
        try {
          const { sql } = await import('../../lib/db');
          await sql`
            INSERT INTO user_deployments (
              user_email,
              project_id,
              vercel_project_id,
              deployment_id,
              deployment_url,
              deployment_data,
              created_at
            ) VALUES (
              ${userEmail},
              ${projectId},
              ${projectId_vercel},
              ${deployment.id},
              ${deployment.url},
              ${JSON.stringify(deployment)},
              NOW()
            )
            ON CONFLICT (user_email, project_id)
            DO UPDATE SET
              deployment_id = EXCLUDED.deployment_id,
              deployment_url = EXCLUDED.deployment_url,
              deployment_data = EXCLUDED.deployment_data,
              updated_at = NOW()
          `;
        } catch (dbError) {
          console.error('Failed to store deployment info:', dbError);
          // Don't fail the deployment for database issues
        }
      }

      return res.status(200).json({
        success: true,
        deployment: {
          id: deployment.id,
          url: deployment.url,
          status: deployment.status,
          createdAt: deployment.createdAt,
          vercelProjectId: projectId_vercel
        },
        message: 'Deployment created successfully'
      });

    } catch (error) {
      console.error('Vercel deployment error:', error);
      return res.status(500).json({
        message: 'Deployment failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Vercel deploy API error:', error);
    return res.status(500).json({
      message: 'Deployment API error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}