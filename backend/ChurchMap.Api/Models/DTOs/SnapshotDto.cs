namespace ChurchMap.Api.Models.DTOs;

public record SnapshotDto(
    int Id,
    string LocationKey,
    string LocationLabel,
    DateTime CreatedAt,
    int TotalCount
);
