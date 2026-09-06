using Microsoft.AspNetCore.Mvc;

namespace MeetupPlanner.Shared;

public class BaseQueryParameters
{
    [FromQuery(Name = "page")]
    public int? Page { get; set; }
    [FromQuery(Name = "pageSize")]
    public int? PageSize { get; set; }

    [FromQuery(Name = "orderBy")]
    public OrderBy? OrderBy { get; set; }

    [FromQuery(Name = "sortOrder")]
    public SortOrder? SortOrder { get; set; }
}
