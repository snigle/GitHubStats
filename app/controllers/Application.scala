package controllers

import play.api._
import play.api.libs.json.Json
import play.api.libs.json.Reads
import play.api.libs.ws.WSClient
import play.api.mvc._
import javax.inject.Inject
import play.api.libs.json._
import play.api.libs.functional.syntax._
import scala.concurrent.ExecutionContext.Implicits.global

case class Author(login: Option[String], name: String, email: String, avatar_url: Option[String], total: Option[Int])
case class Commit(message: String, author: Author, date: String, sha: String)

class Application @Inject() (ws: WSClient) extends Controller {

  //  Json readers
  implicit val authorReader: Reads[Author] = (
    (__ \ "author" \ "login").readNullable[String] and
    (__ \ "commit" \ "author" \ "name").read[String] and
    (__ \ "commit" \ "author" \ "email").read[String] and
    (__ \ "author" \ "avatar_url").readNullable[String] and
    (__ \ "author" \ "total").readNullable[Int]
  )(Author.apply _)

  implicit val commitReader = (
    (__ \ "commit" \ "message").read[String] and
    (__).read[Author] and
    (__ \ "commit" \ "author" \ "date").read[String] and
    (__ \ "sha").read[String]
  )(Commit.apply _)
  //Json writers

  implicit val authorToJson = new Writes[Author] {
    def writes(author: Author) = Json.obj(
      "login" -> author.login,
      "name" -> author.name,
      "email" -> author.email,
      "avatar_url" -> author.avatar_url,
      "total" -> author.total
    )
  }
  implicit val commitToJson = new Writes[Commit] {
    def writes(commit: Commit) = Json.obj(
      "message" -> commit.message,
      "author" -> commit.author,
      "date" -> commit.date,
      "sha" -> commit.sha
    )
  }

  def index() = Action { implicit request =>
    Ok(views.html.index("GitHub Stats"))
  }

  def repo(name: String) = Action { implicit request =>
    Ok(views.html.index(name + " - GitHubStats"))
  }

  def commits(repo: String, page: Int) = Action.async {
    ws.url("https://api.github.com/repos/" + repo + "/commits?per_page=100&page=" + page).withHeaders("Accept" -> "application/json").get.map(response => {
        var commits : Seq[Commit] = Nil;
        var authors : Iterable[Author] = Nil
      if (response.status == 200) {
        commits = response.json.validate[Seq[Commit]].get;
        println(response.allHeaders)
        authors = commits.groupBy(commit => commit.author.email).mapValues(c_all =>
          Author(
            c_all.flatMap(a => a.author.login).headOption,
            c_all.map(a => a.author.name).head,
            c_all.map(a => a.author.email).head,
            c_all.flatMap(a => a.author.avatar_url).headOption,
            Some(c_all.length)
          )).values
      }
   
        Ok(Json.toJson(Map(
        "commits" -> Json.toJson(commits),
        "authors" -> Json.toJson(authors)
      ))).withHeaders(
        "x-ratelimit-remaining" -> response.header("X-RateLimit-Remaining").getOrElse("0"),
        "x-ratelimit-reset" -> response.header("X-RateLimit-Reset").getOrElse("0")
      )

    });
  }

  def login(code: String) = Action.async { implicit request =>
    {
      ws.url("https://github.com/login/oauth/access_token").withHeaders("Accept" -> "application/json").post(
        Json.toJson(Map(
          "client_id" -> "023b4b4bb7288038ddc4",
          "client_secret" -> "43f14fe116ac645011d70711d59fdcc0e09a4bbf",
          "code" -> code
        ))
      )
        .map(response => {
          Ok(response.json).withCookies(
            Cookie(
              "access_token",
              (response.json \ "access_token").get.toString,
              Some(60 * 60 * 24 * 7),
              httpOnly = true
            )
          )
        })

    }
  }

}
