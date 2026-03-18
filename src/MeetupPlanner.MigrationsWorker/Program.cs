using MeetupPlanner.MigrationsWorker;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHostedService<Worker>();

builder.AddSqlServerDbContext<MeetupPlanner.Infrastructure.MeetupPlannerDbContext>("MeetupPlanner", configureDbContextOptions: options =>
{
    options.ConfigureSqlEngine(o => o.MigrationsAssembly("MeetupPlanner"));
});

var host = builder.Build();
host.Run();
